import * as vscode from 'vscode';

import { SceneEditorProvider } from './scene';

const registerFileEditors = (context: vscode.ExtensionContext) => {
    context.subscriptions.push(SceneEditorProvider.register(context));
};

export default registerFileEditors;
