import * as vscode from "vscode";

// getBinPath returns the path to the tool.
export function getBinPath(tool: string, useCache = true): string {
	const r = getBinPathWithExplanation(tool, useCache);
	return r.binPath;
}

// getBinPathWithExplanation returns the path to the tool, and the explanation on why
// the path was chosen. See getBinPathWithPreferredGopathGorootWithExplanation for details.
export function getBinPathWithExplanation(
	tool: string,
	useCache = true,
	uri?: vscode.Uri
): { binPath: string; why?: string } {
	return { binPath: "cue", why: 'default' };
}
