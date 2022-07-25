/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((module) => {

module.exports = require("vscode");

/***/ }),
/* 2 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.createRegisterCommand = void 0;
const vscode = __webpack_require__(1);
function createRegisterCommand(ctx, cueCtx) {
    return function registerCommand(name, fn) {
        ctx.subscriptions.push(vscode.commands.registerCommand(name, fn(ctx, cueCtx)));
    };
}
exports.createRegisterCommand = createRegisterCommand;


/***/ }),
/* 3 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.deactivate = exports.helloWorld = void 0;
const vscode = __webpack_require__(1);
function helloWorld(context) {
    return (ctx, cueCtx) => () => {
        vscode.window.showWarningMessage('Hello World from HelloWorld!');
    };
}
exports.helloWorld = helloWorld;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;


/***/ }),
/* 4 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.cueLint = exports.lintCode = void 0;
const path = __webpack_require__(5);
const vscode = __webpack_require__(1);
const config_1 = __webpack_require__(6);
const cueStatus_1 = __webpack_require__(7);
const utils_1 = __webpack_require__(8);
/**
 * Runs linter on the current file, package or workspace.
 */
function lintCode(scope) {
    return (ctx, cueCtx) => () => {
        const editor = vscode.window.activeTextEditor;
        if (scope !== 'workspace') {
            if (!editor) {
                vscode.window.showInformationMessage('No editor is active, cannot find current package to lint');
                return;
            }
            if (editor.document.languageId !== 'cue') {
                vscode.window.showInformationMessage('File in the active editor is not a Cue file, cannot find current package to lint');
                return;
            }
        }
        const documentUri = editor ? editor.document.uri : undefined;
        const cueConfig = (0, config_1.getCueConfig)(documentUri);
        cueStatus_1.outputChannel.clear(); // Ensures stale output from lint on save is cleared
        cueStatus_1.diagnosticsStatusBarItem.show();
        cueStatus_1.diagnosticsStatusBarItem.text = 'Linting...';
        cueLint(documentUri, cueConfig, scope)
            .then((warnings) => {
            (0, utils_1.handleDiagnosticErrors)(cueCtx, editor ? editor.document : undefined, warnings, cueCtx.lintDiagnosticCollection);
            cueStatus_1.diagnosticsStatusBarItem.hide();
        })
            .catch((err) => {
            vscode.window.showInformationMessage('Error: ' + err);
            cueStatus_1.diagnosticsStatusBarItem.text = 'Linting Failed';
        });
    };
}
exports.lintCode = lintCode;
let epoch = 0;
let tokenSource;
let running = false;
/**
 * Runs linter and presents the output in the 'Cue' channel and in the diagnostic collections.
 *
 * @param fileUri Document uri.
 * @param cueConfig Configuration for the Cue extension.
 * @param scope Scope in which to run the linter.
 */
function cueLint(fileUri, cueConfig, scope) {
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
    const currentWorkspace = (0, utils_1.getWorkspaceFolderPath)(fileUri);
    const cwd = scope === 'workspace' && currentWorkspace ? currentWorkspace : path.dirname(fileUri?.fsPath ?? '');
    if (!path.isAbsolute(cwd)) {
        return Promise.resolve([]);
    }
    const lintFlags = cueConfig['lintFlags'] || [];
    const lintEnv = {}; // TODO: Env
    const args = [];
    lintFlags.forEach((flag) => {
        args.push(flag);
    });
    if (scope === 'workspace' && currentWorkspace) {
        args.push('./...');
        cueStatus_1.outputChannel.appendLine(`Starting linting the current workspace at ${currentWorkspace}`);
    }
    else if (scope === 'file') {
        args.push(fileUri?.fsPath ?? '');
        cueStatus_1.outputChannel.appendLine(`Starting linting the current file at ${fileUri?.fsPath}`);
    }
    else {
        cueStatus_1.outputChannel.appendLine(`Starting linting the current package at ${cwd}`);
    }
    running = true;
    const lintPromise = (0, utils_1.runTool)(args, cwd, 'warning', false, lintTool, lintEnv, false, tokenSource.token).then((result) => {
        if (closureEpoch === epoch) {
            running = false;
        }
        return result;
    });
    return lintPromise;
}
exports.cueLint = cueLint;


/***/ }),
/* 5 */
/***/ ((module) => {

module.exports = require("path");

/***/ }),
/* 6 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getCueConfig = void 0;
const vscode = __webpack_require__(1);
/** getCueConfig is declared as an exported const rather than a function, so it can be stubbbed in testing. */
const getCueConfig = (uri) => {
    return getConfig('cue', uri);
};
exports.getCueConfig = getCueConfig;
function getConfig(section, uri) {
    if (!uri) {
        if (vscode.window.activeTextEditor) {
            uri = vscode.window.activeTextEditor.document.uri;
        }
        else {
            uri = null;
        }
    }
    return vscode.workspace.getConfiguration(section, uri);
}


/***/ }),
/* 7 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.diagnosticsStatusBarItem = exports.outputChannel = void 0;
const vscode = __webpack_require__(1);
exports.outputChannel = vscode.window.createOutputChannel('Cue');
const STATUS_BAR_ITEM_NAME = 'CueLang Diagnostics';
exports.diagnosticsStatusBarItem = vscode.window.createStatusBarItem(STATUS_BAR_ITEM_NAME, vscode.StatusBarAlignment.Left);
exports.diagnosticsStatusBarItem.name = STATUS_BAR_ITEM_NAME;


/***/ }),
/* 8 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.handleDiagnosticErrors = exports.getWorkspaceFolderPath = exports.resolvePath = exports.runTool = void 0;
const vscode = __webpack_require__(1);
const path = __webpack_require__(5);
const cp = __webpack_require__(9);
const pathUtils_1 = __webpack_require__(10);
const map_1 = __webpack_require__(12);
const cueStatus_1 = __webpack_require__(7);
const process_1 = __webpack_require__(13);
/**
 * Runs given Cue tool and returns errors/warnings that can be fed to the Problems Matcher
 * @param args Arguments to be passed while running given tool
 * @param cwd cwd that will passed in the env object while running given tool
 * @param severity error or warning
 * @param useStdErr If true, the stderr of the output of the given tool will be used, else stdout will be used
 * @param toolName The name of the Go tool to run. If none is provided, the go runtime itself is used
 * @param printUnexpectedOutput If true, then output that doesnt match expected format is printed to the output channel
 */
function runTool(args, cwd, severity, useStdErr, toolName, env, printUnexpectedOutput, token) {
    let cmd;
    cmd = "cue " + toolName;
    //return Promise.reject(new Error('Cannot find "go" binary. Update PATH or GOROOT appropriately'));
    let p;
    if (token) {
        token.onCancellationRequested(() => {
            if (p) {
                (0, process_1.killProcessTree)(p);
            }
        });
    }
    cwd = (0, pathUtils_1.fixDriveCasingInWindows)(cwd);
    return new Promise((resolve, reject) => {
        p = cp.execFile(cmd, args, { env, cwd }, (err, stdout, stderr) => {
            try {
                if (err && err.code === 'ENOENT') {
                    // Since the tool is run on save which can be frequent
                    // we avoid sending explicit notification if tool is missing
                    console.log(`Cannot find ${toolName ? toolName : 'go'}`);
                    return resolve([]);
                }
                if (err && stderr && !useStdErr) {
                    cueStatus_1.outputChannel.appendLine(['Error while running tool:', cmd, ...args].join(' '));
                    cueStatus_1.outputChannel.appendLine(stderr);
                    return resolve([]);
                }
                const lines = (useStdErr ? stderr : stdout).toString().split('\n');
                cueStatus_1.outputChannel.appendLine([cwd + '>Finished running tool:', cmd, ...args].join(' '));
                const ret = [];
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
                    if (!path.isAbsolute(file) &&
                        (file.startsWith(`vendor${path.sep}`) || file.indexOf(`${path.sep}vendor${path.sep}`) > -1)) {
                        continue;
                    }
                    const filePath = path.resolve(cwd, file);
                    ret.push({ file: filePath, line, col, msg, severity });
                    cueStatus_1.outputChannel.appendLine(`${filePath}:${line}:${col ?? ''} ${msg}`);
                }
                if (!atLeastSingleMatch && unexpectedOutput && vscode.window.activeTextEditor) {
                    cueStatus_1.outputChannel.appendLine(stderr);
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
                cueStatus_1.outputChannel.appendLine('');
                resolve(ret);
            }
            catch (e) {
                reject(e);
            }
        });
    });
}
exports.runTool = runTool;
/**
* Expands ~ to homedir in non-Windows platform and resolves
* ${workspaceFolder}, ${workspaceRoot} and ${workspaceFolderBasename}
*/
function resolvePath(inputPath, workspaceFolder) {
    if (!inputPath || !inputPath.trim()) {
        return inputPath;
    }
    if (!workspaceFolder && vscode.workspace.workspaceFolders) {
        workspaceFolder = getWorkspaceFolderPath(vscode.window.activeTextEditor && vscode.window.activeTextEditor.document.uri);
    }
    if (workspaceFolder) {
        inputPath = inputPath.replace(/\${workspaceFolder}|\${workspaceRoot}/g, workspaceFolder);
        inputPath = inputPath.replace(/\${workspaceFolderBasename}/g, path.basename(workspaceFolder));
    }
    return (0, pathUtils_1.resolveHomeDir)(inputPath);
}
exports.resolvePath = resolvePath;
function getWorkspaceFolderPath(fileUri) {
    if (fileUri) {
        const workspace = vscode.workspace.getWorkspaceFolder(fileUri);
        if (workspace) {
            return (0, pathUtils_1.fixDriveCasingInWindows)(workspace.uri.fsPath);
        }
    }
    // fall back to the first workspace
    const folders = vscode.workspace.workspaceFolders;
    if (folders && folders.length) {
        return (0, pathUtils_1.fixDriveCasingInWindows)(folders[0].uri.fsPath);
    }
    return undefined;
}
exports.getWorkspaceFolderPath = getWorkspaceFolderPath;
function handleDiagnosticErrors(cueCtx, document, errors, diagnosticCollection, diagnosticSource) {
    diagnosticCollection?.clear();
    const diagnosticMap = new Map();
    const textDocumentMap = new Map();
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
            const tempRange = new vscode.Range(error.line - 1, 0, error.line - 1, doc.lineAt(error.line - 1).range.end.character + 1 // end of the line
            );
            const text = doc.getText(tempRange);
            const [, leading, trailing] = /^(\s*).*(\s*)$/.exec(text);
            if (!error.col) {
                startColumn = leading.length; // beginning of the non-white space.
            }
            else {
                startColumn = error.col - 1; // range is 0-indexed
            }
            endColumn = text.length - trailing.length;
        }
        const range = new vscode.Range(error.line - 1, startColumn, error.line - 1, endColumn);
        const severity = (0, map_1.mapSeverityToVSCodeSeverity)(error.severity);
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
exports.handleDiagnosticErrors = handleDiagnosticErrors;


/***/ }),
/* 9 */
/***/ ((module) => {

module.exports = require("child_process");

/***/ }),
/* 10 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.resolveHomeDir = exports.fixDriveCasingInWindows = void 0;
const path = __webpack_require__(5);
const os = __webpack_require__(11);
// Workaround for issue in https://github.com/Microsoft/vscode/issues/9448#issuecomment-244804026
function fixDriveCasingInWindows(pathToFix) {
    return process.platform === 'win32' && pathToFix
        ? pathToFix.substr(0, 1).toUpperCase() + pathToFix.substr(1)
        : pathToFix;
}
exports.fixDriveCasingInWindows = fixDriveCasingInWindows;
/**
 * Expands ~ to homedir in non-Windows platform
 */
function resolveHomeDir(inputPath) {
    if (!inputPath || !inputPath.trim()) {
        return inputPath;
    }
    return inputPath.startsWith('~') ? path.join(os.homedir(), inputPath.substr(1)) : inputPath;
}
exports.resolveHomeDir = resolveHomeDir;


/***/ }),
/* 11 */
/***/ ((module) => {

module.exports = require("os");

/***/ }),
/* 12 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.mapSeverityToVSCodeSeverity = void 0;
const vscode = __webpack_require__(1);
function mapSeverityToVSCodeSeverity(sev) {
    switch (sev) {
        case 'error':
            return vscode.DiagnosticSeverity.Error;
        case 'warning':
            return vscode.DiagnosticSeverity.Warning;
        default:
            return vscode.DiagnosticSeverity.Error;
    }
}
exports.mapSeverityToVSCodeSeverity = mapSeverityToVSCodeSeverity;


/***/ }),
/* 13 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


/* eslint-disable @typescript-eslint/no-explicit-any */
/*---------------------------------------------------------
 * Copyright 2020 The Go Authors. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.killProcessTree = void 0;
const kill = __webpack_require__(14);
// Kill a process and its children, returning a promise.
function killProcessTree(p, logger = console.log) {
    if (!p || !p.pid || p.exitCode !== null) {
        return Promise.resolve();
    }
    return new Promise((resolve) => {
        kill(p.pid, (err) => {
            if (err) {
                logger(`Error killing process ${p.pid}: ${err}`);
            }
            resolve();
        });
    });
}
exports.killProcessTree = killProcessTree;


/***/ }),
/* 14 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {



var childProcess = __webpack_require__(9);
var spawn = childProcess.spawn;
var exec = childProcess.exec;

module.exports = function (pid, signal, callback) {
    if (typeof signal === 'function' && callback === undefined) {
        callback = signal;
        signal = undefined;
    }

    pid = parseInt(pid);
    if (Number.isNaN(pid)) {
        if (callback) {
            return callback(new Error("pid must be a number"));
        } else {
            throw new Error("pid must be a number");
        }
    }

    var tree = {};
    var pidsToProcess = {};
    tree[pid] = [];
    pidsToProcess[pid] = 1;

    switch (process.platform) {
    case 'win32':
        exec('taskkill /pid ' + pid + ' /T /F', callback);
        break;
    case 'darwin':
        buildProcessTree(pid, tree, pidsToProcess, function (parentPid) {
          return spawn('pgrep', ['-P', parentPid]);
        }, function () {
            killAll(tree, signal, callback);
        });
        break;
    // case 'sunos':
    //     buildProcessTreeSunOS(pid, tree, pidsToProcess, function () {
    //         killAll(tree, signal, callback);
    //     });
    //     break;
    default: // Linux
        buildProcessTree(pid, tree, pidsToProcess, function (parentPid) {
          return spawn('ps', ['-o', 'pid', '--no-headers', '--ppid', parentPid]);
        }, function () {
            killAll(tree, signal, callback);
        });
        break;
    }
};

function killAll (tree, signal, callback) {
    var killed = {};
    try {
        Object.keys(tree).forEach(function (pid) {
            tree[pid].forEach(function (pidpid) {
                if (!killed[pidpid]) {
                    killPid(pidpid, signal);
                    killed[pidpid] = 1;
                }
            });
            if (!killed[pid]) {
                killPid(pid, signal);
                killed[pid] = 1;
            }
        });
    } catch (err) {
        if (callback) {
            return callback(err);
        } else {
            throw err;
        }
    }
    if (callback) {
        return callback();
    }
}

function killPid(pid, signal) {
    try {
        process.kill(parseInt(pid, 10), signal);
    }
    catch (err) {
        if (err.code !== 'ESRCH') throw err;
    }
}

function buildProcessTree (parentPid, tree, pidsToProcess, spawnChildProcessesList, cb) {
    var ps = spawnChildProcessesList(parentPid);
    var allData = '';
    ps.stdout.on('data', function (data) {
        var data = data.toString('ascii');
        allData += data;
    });

    var onClose = function (code) {
        delete pidsToProcess[parentPid];

        if (code != 0) {
            // no more parent processes
            if (Object.keys(pidsToProcess).length == 0) {
                cb();
            }
            return;
        }

        allData.match(/\d+/g).forEach(function (pid) {
          pid = parseInt(pid, 10);
          tree[parentPid].push(pid);
          tree[pid] = [];
          pidsToProcess[pid] = 1;
          buildProcessTree(pid, tree, pidsToProcess, spawnChildProcessesList, cb);
        });
    };

    ps.on('close', onClose);
}


/***/ }),
/* 15 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


/*---------------------------------------------------------
 * Copyright 2021 The Go Authors. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", ({ value: true }));
const getBin_1 = __webpack_require__(16);
const api = {
    settings: {
        getExecutionCommand(toolName, resource) {
            const { binPath } = (0, getBin_1.getBinPathWithExplanation)(toolName, true, resource);
            return { binPath };
        }
    }
};
exports["default"] = api;


/***/ }),
/* 16 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getBinPathWithExplanation = exports.getBinPath = void 0;
// getBinPath returns the path to the tool.
function getBinPath(tool, useCache = true) {
    const r = getBinPathWithExplanation(tool, useCache);
    return r.binPath;
}
exports.getBinPath = getBinPath;
// getBinPathWithExplanation returns the path to the tool, and the explanation on why
// the path was chosen. See getBinPathWithPreferredGopathGorootWithExplanation for details.
function getBinPathWithExplanation(tool, useCache = true, uri) {
    return { binPath: "cue", why: 'default' };
}
exports.getBinPathWithExplanation = getBinPathWithExplanation;


/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = __webpack_require__(1);
const commands = __webpack_require__(2);
const helloWorld_1 = __webpack_require__(3);
const cueLint_1 = __webpack_require__(4);
const extensionAPI_1 = __webpack_require__(15);
const cueCtx = {};
// this method is called when your extension is activated-
// your extension is activated the very first time the command is executed
async function activate(ctx) {
    cueCtx.lintDiagnosticCollection = vscode.languages.createDiagnosticCollection("cue");
    ctx.subscriptions.push(cueCtx.lintDiagnosticCollection);
    const registerCommand = commands.createRegisterCommand(ctx, cueCtx);
    registerCommand('cue.lint.package', (0, cueLint_1.lintCode)('package'));
    registerCommand('cue.lint.workspace', (0, cueLint_1.lintCode)('workspace'));
    registerCommand('cue.lint.file', (0, cueLint_1.lintCode)('file'));
    registerCommand('cue.test', (0, helloWorld_1.helloWorld)(ctx));
    return extensionAPI_1.default;
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() {
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
exports.deactivate = deactivate;

})();

module.exports = __webpack_exports__;
/******/ })()
;
//# sourceMappingURL=extension.js.map