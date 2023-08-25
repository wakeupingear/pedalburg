import * as vscode from 'vscode';
import registerGameAssets from './gameAssets';

export function activate(context: vscode.ExtensionContext) {
    registerGameAssets();
}

export function deactivate() {}
