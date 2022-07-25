import * as path from "path";
import * as vscode from "vscode";
import { CommandFactory } from './commands';
import { getCueConfig } from './config';
import { diagnosticsStatusBarItem, outputChannel } from './cueStatus';
import { getWorkspaceFolderPath, handleDiagnosticErrors, ICheckResult, resolvePath, runTool } from './utils';

/**
 * Runs linter on the current file, package or workspace.
 */
export function lintCode(scope?: string): CommandFactory {
	return (ctx, cueCtx) => () => {
		const editor = vscode.window.activeTextEditor;
		if (scope !== 'workspace') {
			if (!editor) {
				vscode.window.showInformationMessage('No editor is active, cannot find current package to lint');
				return;
			}
			if (editor.document.languageId !== 'cue') {
				vscode.window.showInformationMessage(
					'File in the active editor is not a Cue file, cannot find current package to lint'
				);
				return;
			}
		}

		const documentUri = editor ? editor.document.uri : undefined;
        const cueConfig = getCueConfig(documentUri);

		outputChannel.clear(); // Ensures stale output from lint on save is cleared
		diagnosticsStatusBarItem.show();
		diagnosticsStatusBarItem.text = 'Linting...';

		cueLint(documentUri, cueConfig, scope)
			.then((warnings) => {
				handleDiagnosticErrors(
					cueCtx,
					editor ? editor.document : undefined,
					warnings,
					cueCtx.lintDiagnosticCollection,
				);
				diagnosticsStatusBarItem.hide();
			})
			.catch((err) => {
				vscode.window.showInformationMessage('Error: ' + err);
				diagnosticsStatusBarItem.text = 'Linting Failed';
			});
	};
}

let epoch = 0;
let tokenSource: vscode.CancellationTokenSource;
let running = false;

/**
 * Runs linter and presents the output in the 'Cue' channel and in the diagnostic collections.
 *
 * @param fileUri Document uri.
 * @param cueConfig Configuration for the Cue extension.
 * @param scope Scope in which to run the linter.
 */
 export function cueLint(
	fileUri: vscode.Uri | undefined,
	cueConfig: vscode.WorkspaceConfiguration,
	scope?: string
): Promise<ICheckResult[]> {
	const lintTool = 'vet';
	epoch++;
	const closureEpoch = epoch;
	if (tokenSource) {
		if (running) {
			tokenSource.cancel();
		}
		tokenSource.dispose();
	}
	tokenSource = new vscode.CancellationTokenSource();
	const currentWorkspace = getWorkspaceFolderPath(fileUri);

	const cwd = scope === 'workspace' && currentWorkspace ? currentWorkspace : path.dirname(fileUri?.fsPath ?? '');
	if (!path.isAbsolute(cwd)) {
		return Promise.resolve([]);
	}

	const lintFlags: string[] = cueConfig['lintFlags'] || [];
	const lintEnv = {}; // TODO: Env
	const args: string[] = [];
	lintFlags.forEach((flag) => {
		args.push(flag);
	});

	if (scope === 'workspace' && currentWorkspace) {
		args.push('./...');
		outputChannel.appendLine(`Starting linting the current workspace at ${currentWorkspace}`);
	} else if (scope === 'file') {
		args.push(fileUri?.fsPath ?? '');
		outputChannel.appendLine(`Starting linting the current file at ${fileUri?.fsPath}`);
	} else {
		outputChannel.appendLine(`Starting linting the current package at ${cwd}`);
	}

	running = true;
	const lintPromise = runTool(args, cwd, 'warning', false, lintTool, lintEnv, false, tokenSource.token).then(
		(result) => {
			if (closureEpoch === epoch) {
				running = false;
			}
			return result;
		}
	);

	return lintPromise;
}