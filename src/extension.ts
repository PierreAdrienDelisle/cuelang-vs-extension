// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as commands from './commands';
import { CueLangExtensionContext } from './context';
import { helloWorld } from './helloWorld';
import { lintCode } from './cueLint';
import extensionAPI from './extensionAPI';
import { ExtensionAPI } from './export';

const cueCtx: CueLangExtensionContext = {};

// this method is called when your extension is activated-
// your extension is activated the very first time the command is executed
export async function activate(ctx: vscode.ExtensionContext): Promise<ExtensionAPI | undefined>  {
	cueCtx.lintDiagnosticCollection = vscode.languages.createDiagnosticCollection("cue");
    ctx.subscriptions.push(cueCtx.lintDiagnosticCollection);

	const registerCommand = commands.createRegisterCommand(ctx, cueCtx);
	registerCommand('cue.lint.package', lintCode('package'));
	registerCommand('cue.lint.workspace', lintCode('workspace'));
	registerCommand('cue.lint.file', lintCode('file'));
	registerCommand('cue.test', helloWorld(ctx));

	return extensionAPI;
}

// this method is called when your extension is deactivated
export function deactivate() {
	/*
	return Promise.all([
		cueCtx.languageClient?.stop(),
		cancelRunningTests(),
		killRunningPprof(),
		Promise.resolve(cleanupTempDir()),
		Promise.resolve(disposeGoStatusBar())
	]);
	*/
}
