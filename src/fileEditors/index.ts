import * as vscode from 'vscode';

import { PawDrawEditorProvider } from './scene';

const registerFileEditors = (context: vscode.ExtensionContext) => {
    context.subscriptions.push(PawDrawEditorProvider.register(context));
};

export default registerFileEditors;
