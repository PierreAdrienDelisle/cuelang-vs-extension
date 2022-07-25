import * as path from "path";
import * as os from "os";
import * as vscode from "vscode";

// Workaround for issue in https://github.com/Microsoft/vscode/issues/9448#issuecomment-244804026
export function fixDriveCasingInWindows(pathToFix: string): string {
	return process.platform === 'win32' && pathToFix
		? pathToFix.substr(0, 1).toUpperCase() + pathToFix.substr(1)
		: pathToFix;
}

/**
 * Expands ~ to homedir in non-Windows platform
 */
 export function resolveHomeDir(inputPath: string): string {
	if (!inputPath || !inputPath.trim()) {
		return inputPath;
	}
	return inputPath.startsWith('~') ? path.join(os.homedir(), inputPath.substr(1)) : inputPath;
}