import * as vscode from 'vscode';
import * as fs from 'fs';
import * as chokidar from 'chokidar';

import { ASSET_FOLDER } from './constants';
import { capitalizeFirstLetter } from './utils';

class FolderNode extends vscode.TreeItem {
    constructor(
        public readonly name: string,
        public readonly path: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode
            .TreeItemCollapsibleState.Collapsed
    ) {
        super(capitalizeFirstLetter(name));

        if (collapsibleState === vscode.TreeItemCollapsibleState.Collapsed) {
            this.iconPath = new vscode.ThemeIcon('folder');
        } else {
            this.iconPath = new vscode.ThemeIcon('file');
            this.command = {
                command: 'gameAssets.openFile',
                title: 'Open File',
                arguments: [this.path],
            };
        }
    }
}

export class GameAssetsProvider implements vscode.TreeDataProvider<FolderNode> {
    private _onDidChangeTreeData: vscode.EventEmitter<
        FolderNode | undefined | null | void
    > = new vscode.EventEmitter<FolderNode | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<
        FolderNode | undefined | null | void
    > = this._onDidChangeTreeData.event;

    refresh(): void {
        console.log('Refreshing Game Assets');
        this._onDidChangeTreeData.fire();
    }

    private watcher: chokidar.FSWatcher | null = null;

    private startWatching(folderPath: string) {
        if (this.watcher) {
            return;
        }

        // Start a new Chokidar watcher for the folder
        this.watcher = chokidar.watch(folderPath, {
            ignored: /[\/\\]\./, // Ignore hidden files/directories
            persistent: true,
            depth: Infinity,
        });

        this.watcher.on('add', () => this.refresh());
        this.watcher.on('unlink', () => this.refresh());
    }

    dispose() {
        if (this.watcher) {
            this.watcher.close();
        }
    }

    getTreeItem(element: FolderNode): vscode.TreeItem {
        return element;
    }

    getChildren(element?: FolderNode): Thenable<FolderNode[]> {
        if (!element) {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                vscode.window.showInformationMessage(
                    'No workspace folder is open'
                );
                return Promise.resolve([]);
            }

            const assetsFolderPath = vscode.Uri.joinPath(
                workspaceFolders[0].uri,
                ASSET_FOLDER
            ).path;

            this.startWatching(assetsFolderPath);

            return new Promise((resolve, reject) => {
                fs.readdir(assetsFolderPath, (err, files) => {
                    if (err) {
                        reject(err);
                    } else {
                        const subfolders = files
                            .filter((file) =>
                                fs
                                    .statSync(`${assetsFolderPath}/${file}`)
                                    .isDirectory()
                            )
                            .map((folder) => {
                                const newPath = `${assetsFolderPath}/${folder}`;
                                return new FolderNode(folder, newPath);
                            });
                        resolve(subfolders);
                    }
                });
            });
        }

        if (fs.statSync(element.path).isDirectory()) {
            const files = fs.readdirSync(element.path);

            return Promise.resolve(
                files.map((file) => {
                    const newPath = `${element.path}/${file}`;

                    return new FolderNode(
                        file,
                        newPath,
                        fs.statSync(`${element.path}/${file}`).isDirectory()
                            ? vscode.TreeItemCollapsibleState.Collapsed
                            : vscode.TreeItemCollapsibleState.None
                    );
                })
            );
        }

        return Promise.resolve([]);
    }
}

const registerGameAssets = () => {
    const provider = new GameAssetsProvider();
    vscode.window.createTreeView('gameAssets', {
        treeDataProvider: provider,
    });

    vscode.commands.registerCommand('gameAssets.refresh', () =>
        provider.refresh()
    );

    vscode.commands.registerCommand('gameAssets.openFile', (resource) =>
        vscode.commands.executeCommand('vscode.open', vscode.Uri.file(resource))
    );
};

export default registerGameAssets;
