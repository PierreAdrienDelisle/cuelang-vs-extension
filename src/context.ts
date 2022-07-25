import * as vscode from 'vscode';

export interface CueLangExtensionContext {
	lastUserAction?: Date;
	crashCount?: number;
	lintDiagnosticCollection?: vscode.DiagnosticCollection;
	vetDiagnosticCollection?: vscode.DiagnosticCollection;
}
