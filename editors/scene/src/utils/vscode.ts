import { WebviewApi } from 'vscode-webview';

let VSCODE: WebviewApi<unknown> = undefined as unknown as WebviewApi<unknown>;

if (!VSCODE) {
    VSCODE = acquireVsCodeApi();
}

export default VSCODE as WebviewApi<unknown>;

const styles = getComputedStyle(document.querySelector('html') as HTMLElement);
export const COL_EDITOR_BACKGROUND = styles.getPropertyValue(
    '--vscode-editor-background'
);
export const COL_EDITOR_FOREGROUND = styles.getPropertyValue(
    '--vscode-editor-foreground'
);
export const COL_EDITOR_TABS_BACKGROUND = styles.getPropertyValue(
    '--vscode-editorGroupHeader-tabsBackground'
);
