import vscode = require('vscode');

export const outputChannel = vscode.window.createOutputChannel('Cue');

const STATUS_BAR_ITEM_NAME = 'CueLang Diagnostics';
export const diagnosticsStatusBarItem = vscode.window.createStatusBarItem(
	STATUS_BAR_ITEM_NAME,
	vscode.StatusBarAlignment.Left
);
diagnosticsStatusBarItem.name = STATUS_BAR_ITEM_NAME;