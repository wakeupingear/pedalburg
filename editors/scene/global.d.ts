interface vscode {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    postMessage(message: any): void;
}

declare const vscode: vscode;
