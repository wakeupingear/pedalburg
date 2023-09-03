import * as vscode from 'vscode';
import registerGameAssets from './gameAssets';
import registerFileEditors from './fileEditors';
import registerProjectCommand from './project';

export function activate(context: vscode.ExtensionContext) {
    registerGameAssets();
    registerFileEditors(context);
    registerProjectCommand(context);
}

export function deactivate() {}
