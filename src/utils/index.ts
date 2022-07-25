import * as vscode from "vscode";
import * as path from "path";
import * as cp from "child_process";
import {fixDriveCasingInWindows, resolveHomeDir} from './pathUtils';
import { CueLangExtensionContext } from "../context";
import { mapSeverityToVSCodeSeverity } from "./map";
import { removeDuplicateDiagnostics, deDupeDiagnostics } from "./diagnostics";
import { outputChannel } from '../cueStatus';
import {killProcessTree} from "./process";

export interface ICheckResult {
	file: string;
	line: number;
	col: number | undefined;
	msg: string;
	severity: string;
}

/**
 * Runs given Cue tool and returns errors/warnings that can be fed to the Problems Matcher
 * @param args Arguments to be passed while running given tool
 * @param cwd cwd that will passed in the env object while running given tool
 * @param severity error or warning
 * @param useStdErr If true, the stderr of the output of the given tool will be used, else stdout will be used
 * @param toolName The name of the Go tool to run. If none is provided, the go runtime itself is used
 * @param printUnexpectedOutput If true, then output that doesnt match expected format is printed to the output channel
 */
 export function runTool(
	args: string[],
	cwd: string,
	severity: string,
	useStdErr: boolean,
	toolName: string,
	env: any,
	printUnexpectedOutput: boolean,
	token?: vscode.CancellationToken
): Promise<ICheckResult[]> {
	let cmd: string;
	cmd = "cue " + toolName;
	//return Promise.reject(new Error('Cannot find "go" binary. Update PATH or GOROOT appropriately'));

	let p: cp.ChildProcess;
	if (token) {
		token.onCancellationRequested(() => {
			if (p) {
				killProcessTree(p);
			}
		});
	}
	cwd = fixDriveCasingInWindows(cwd);
	return new Promise((resolve, reject) => {
		p = cp.execFile(cmd, args, { env, cwd }, (err, stdout, stderr) => {
			try {
				if (err && (<any>err).code === 'ENOENT') {
					// Since the tool is run on save which can be frequent
					// we avoid sending explicit notification if tool is missing
					console.log(`Cannot find ${toolName ? toolName : 'go'}`);
					return resolve([]);
				}
				if (err && stderr && !useStdErr) {
					outputChannel.appendLine(['Error while running tool:', cmd, ...args].join(' '));
					outputChannel.appendLine(stderr);
					return resolve([]);
				}
				const lines = (useStdErr ? stderr : stdout).toString().split('\n');
				outputChannel.appendLine([cwd + '>Finished running tool:', cmd, ...args].join(' '));

				const ret: ICheckResult[] = [];
				let unexpectedOutput = false;
				let atLeastSingleMatch = false;
				for (const l of lines) {
					if (l[0] === '\t' && ret.length > 0) {
						ret[ret.length - 1].msg += '\n' + l;
						continue;
					}
					const match = /^([^:]*: )?((.:)?[^:]*):(\d+)(:(\d+)?)?:(?:\w+:)? (.*)$/.exec(l);
					if (!match) {
						if (printUnexpectedOutput && useStdErr && stderr) {
							unexpectedOutput = true;
						}
						continue;
					}
					atLeastSingleMatch = true;
					const [, , file, , lineStr, , colStr, msg] = match;
					const line = +lineStr;
					const col = colStr ? +colStr : undefined;

					// Building skips vendor folders,
					// But vet and lint take in directories and not import paths, so no way to skip them
					// So prune out the results from vendor folders here.
					if (
						!path.isAbsolute(file) &&
						(file.startsWith(`vendor${path.sep}`) || file.indexOf(`${path.sep}vendor${path.sep}`) > -1)
					) {
						continue;
					}

					const filePath = path.resolve(cwd, file);
					ret.push({ file: filePath, line, col, msg, severity });
					outputChannel.appendLine(`${filePath}:${line}:${col ?? ''} ${msg}`);
				}
				if (!atLeastSingleMatch && unexpectedOutput && vscode.window.activeTextEditor) {
					outputChannel.appendLine(stderr);
					if (err) {
						ret.push({
							file: vscode.window.activeTextEditor.document.fileName,
							line: 1,
							col: 1,
							msg: stderr,
							severity: 'error'
						});
					}
				}
				outputChannel.appendLine('');
				resolve(ret);
			} catch (e) {
				reject(e);
			}
		});
	});
}

  /**
 * Expands ~ to homedir in non-Windows platform and resolves
 * ${workspaceFolder}, ${workspaceRoot} and ${workspaceFolderBasename}
 */
export function resolvePath(inputPath: string, workspaceFolder?: string): string {
	if (!inputPath || !inputPath.trim()) {
		return inputPath;
	}

	if (!workspaceFolder && vscode.workspace.workspaceFolders) {
		workspaceFolder = getWorkspaceFolderPath(
			vscode.window.activeTextEditor && vscode.window.activeTextEditor.document.uri
		);
	}

	if (workspaceFolder) {
		inputPath = inputPath.replace(/\${workspaceFolder}|\${workspaceRoot}/g, workspaceFolder);
		inputPath = inputPath.replace(/\${workspaceFolderBasename}/g, path.basename(workspaceFolder));
	}
	return resolveHomeDir(inputPath);
}

export function getWorkspaceFolderPath(fileUri?: vscode.Uri): string | undefined {
	if (fileUri) {
		const workspace = vscode.workspace.getWorkspaceFolder(fileUri);
		if (workspace) {
			return fixDriveCasingInWindows(workspace.uri.fsPath);
		}
	}

	// fall back to the first workspace
	const folders = vscode.workspace.workspaceFolders;
	if (folders && folders.length) {
		return fixDriveCasingInWindows(folders[0].uri.fsPath);
	}
	return undefined;
}


export function handleDiagnosticErrors(
	cueCtx: CueLangExtensionContext,
	document: vscode.TextDocument | undefined,
	errors: ICheckResult[],
	diagnosticCollection?: vscode.DiagnosticCollection,
	diagnosticSource?: string
) {
    diagnosticCollection?.clear();

	const diagnosticMap: Map<string, vscode.Diagnostic[]> = new Map();

	const textDocumentMap: Map<string, vscode.TextDocument> = new Map();
	if (document) {
		textDocumentMap.set(document.uri.toString(), document);
	}
    errors.forEach((error) => {
        const canonicalFile = vscode.Uri.file(error.file).toString();
        let startColumn = error.col ? error.col - 1 : 0;
		let endColumn = startColumn + 1;
		// Some tools output only the line number or the start position.
		// If the file content is available, adjust the diagnostic range so
		// the squiggly underline for the error message is more visible.
		const doc = textDocumentMap.get(canonicalFile);
		if (doc) {
			const tempRange = new vscode.Range(
				error.line - 1,
				0,
				error.line - 1,
				doc.lineAt(error.line - 1).range.end.character + 1 // end of the line
			);
			const text = doc.getText(tempRange);
			const [, leading, trailing] = /^(\s*).*(\s*)$/.exec(text)!;
			if (!error.col) {
				startColumn = leading.length; // beginning of the non-white space.
			} else {
				startColumn = error.col - 1; // range is 0-indexed
			}
			endColumn = text.length - trailing.length;
		}
		const range = new vscode.Range(error.line - 1, startColumn, error.line - 1, endColumn);
		const severity = mapSeverityToVSCodeSeverity(error.severity);
		const diagnostic = new vscode.Diagnostic(range, error.msg, severity);
		// vscode uses source for deduping diagnostics.
		diagnostic.source = diagnosticSource || diagnosticCollection?.name;
		let diagnostics = diagnosticMap.get(canonicalFile);
		if (!diagnostics) {
			diagnostics = [];
		}
		diagnostics.push(diagnostic);
		diagnosticMap.set(canonicalFile, diagnostics);
	});

	diagnosticMap.forEach((newDiagnostics, file) => {
		const fileUri = vscode.Uri.parse(file);

		// TODO: Remove duplicates
		diagnosticCollection?.set(fileUri, newDiagnostics);
	});
}
