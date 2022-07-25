import * as vscode from 'vscode';
import { CommandFactory } from './commands';

export function helloWorld(context: vscode.ExtensionContext): CommandFactory  {
	return (ctx, cueCtx) => () => {
		vscode.window.showWarningMessage('Hello World from HelloWorld!');
	};
}

// this method is called when your extension is deactivated
export function deactivate() {}
