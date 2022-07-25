import vscode = require('vscode');

/** getCueConfig is declared as an exported const rather than a function, so it can be stubbbed in testing. */
export const getCueConfig = (uri?: vscode.Uri) => {
	return getConfig('cue', uri);
};

function getConfig(section: string, uri?: vscode.Uri | null) {
	if (!uri) {
		if (vscode.window.activeTextEditor) {
			uri = vscode.window.activeTextEditor.document.uri;
		} else {
			uri = null;
		}
	}
	return vscode.workspace.getConfiguration(section, uri);
}