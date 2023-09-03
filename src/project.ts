import * as vscode from 'vscode';
import { render } from 'mustache';

const writeResource = async (
    context: vscode.ExtensionContext,
    fromPath: string[],
    toPath: string[],
    folder: vscode.Uri,
    data: any
) =>
    vscode.workspace.fs.writeFile(
        vscode.Uri.joinPath(folder, ...toPath),
        Buffer.from(
            render(
                (
                    await vscode.workspace.fs.readFile(
                        vscode.Uri.joinPath(context.extensionUri, ...fromPath)
                    )
                ).toString(),
                data
            )
        )
    );

const writeResources = async (
    context: vscode.ExtensionContext,
    folder: vscode.Uri,
    data: any,
    paths: [string[], string[]][]
) =>
    Promise.all(
        paths.map((path) => writeResource(context, ...path, folder, data))
    );

const registerProjectCommand = (context: vscode.ExtensionContext) => {
    vscode.commands.registerCommand('petalburg.createProject', async () => {
        const rootFolder = vscode.workspace.workspaceFolders?.[0];

        let id = await vscode.window.showInputBox({
            prompt: 'Enter a name for the new Junebug Game Project',
        });
        if (id === undefined) {
            return;
        }

        id = id.trim();
        id = id || 'junebug-game';
        const lowercaseTitle = id.replace(/-([a-z])/g, (_, c) =>
            c.toUpperCase()
        );
        const title = lowercaseTitle[0].toUpperCase() + lowercaseTitle.slice(1);
        const vanityName = title.split(/(?=[A-Z])/).join(' ');

        const uris = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            defaultUri: vscode.Uri.joinPath(
                rootFolder?.uri ?? vscode.Uri.file(''),
                '../'
            ),
        });
        if (uris === undefined) {
            return;
        }

        try {
            const folder = vscode.Uri.joinPath(uris[0], id);
            try {
                await vscode.workspace.fs.stat(folder);
                vscode.window.showErrorMessage(
                    `Folder '${id}' already exists. Please choose a different name.`
                );
                return;
            } catch (e) {}

            await vscode.workspace.fs.createDirectory(folder);
            await vscode.workspace.fs.createDirectory(
                vscode.Uri.joinPath(folder, 'assets')
            );
            await vscode.workspace.fs.createDirectory(
                vscode.Uri.joinPath(folder, 'assets', 'fonts')
            );
            await vscode.workspace.fs.createDirectory(
                vscode.Uri.joinPath(folder, 'assets', 'scenes')
            );
            await vscode.workspace.fs.createDirectory(
                vscode.Uri.joinPath(folder, 'assets', 'sprites')
            );
            await vscode.workspace.fs.createDirectory(
                vscode.Uri.joinPath(folder, 'src')
            );
            await vscode.workspace.fs.createDirectory(
                vscode.Uri.joinPath(folder, 'lib')
            );

            const data = { vanityName, title, id, lowercaseTitle };
            await writeResources(context, folder, data, [
                [
                    ['resources', 'main.cpp'],
                    ['src', 'main.cpp'],
                ],
                [['resources', 'CMakeLists.txt'], ['CMakeLists.txt']],
                [['resources', '.gitignore.txt'], ['.gitignore']],
                [['resources', '.gitmodules.txt'], ['.gitmodules']],
            ]);

            await vscode.commands.executeCommand(
                'git.clone',
                'https://github.com/wakeupingear/junebug',
                vscode.Uri.joinPath(folder, 'lib').fsPath,
                '--quiet'
            );

            await vscode.commands.executeCommand('vscode.openFolder', folder, {
                forceNewWindow: true,
            });
        } catch (e) {
            vscode.window.showErrorMessage(`Error creating project: ${e}`);
        }
    });
};

export default registerProjectCommand;
