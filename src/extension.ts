import * as vscode from 'vscode';
import registerGameAssets from './gameAssets';
import registerFileEditors from './fileEditors';

export function activate(context: vscode.ExtensionContext) {
    registerGameAssets();
    registerFileEditors(context);
}

export function deactivate() {}
