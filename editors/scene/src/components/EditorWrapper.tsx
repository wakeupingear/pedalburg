import {
    ReactNode,
    useContext,
    useEffect,
    useState,
    createContext,
    useRef,
} from 'react';
import VSCODE from '../utils/vscode';
import { Scene } from '../types/junebug';
import { applyEdit, processInitialScene } from '../utils/junebug';
import { SceneEdit } from '../types/vscode';

type EditorContextProps = {
    editable: boolean;
    fileName: string | null;
    scene: Scene | null;
    validFile: boolean;
    makeEdit: (edit: SceneEdit) => void;
};
const EditorContext = createContext<EditorContextProps>(
    {} as EditorContextProps
);

interface VSCodeProps {
    children: ReactNode;
}

export default function EditorWrapper({ children }: VSCodeProps) {
    const [editable, setEditable] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const [scene, setScene] = useState<Scene | null>(null);
    const [validFile, setValidFile] = useState(true);

    const fileData = useRef<Uint8Array>();

    const reset = (data: Uint8Array | undefined, edits?: SceneEdit[]) => {
        if (data) fileData.current = data;

        const value = new TextDecoder().decode(fileData.current);
        try {
            const newScene = processInitialScene(JSON.parse(value));
            (edits || []).forEach((edit) => {
                applyEdit(newScene, edit);
            });
            setScene(newScene);
            setValidFile(true);
        } catch (e) {
            console.error('Error parsing scene JSON: ', e);
            setValidFile(false);
        }
    };

    const resetUntitled = (edits?: SceneEdit[]) => {
        reset(
            new TextEncoder().encode(
                JSON.stringify(
                    {
                        size: [384, 216],
                    },
                    null,
                    2
                )
            ),
            edits
        );
    };

    useEffect(() => {
        // Handle messages from the extension
        window.addEventListener('message', async (e) => {
            const { type, body, requestId } = e.data;
            switch (type) {
                case 'init': {
                    setEditable(body.editable);
                    setFileName(body.fileName);

                    if (body.untitled) resetUntitled(body.edits);
                    else reset(body.value);

                    break;
                }
                case 'update': {
                    setFileName(body.fileName);
                    reset(body.content, body.edits);

                    break;
                }
                case 'getFileData': {
                    setScene((currScene) => {
                        VSCODE.postMessage({
                            type: 'response',
                            requestId,
                            body: JSON.stringify(currScene, null, 2).replace(
                                /("tiles": \[)([^]]+)/g,
                                (_, a, b) => a + b.replace(/\s+/g, ' ')
                            ),
                        });
                        return currScene;
                    });
                    return;
                }
            }
        });

        // Signal to VS Code that the webview is initialized.
        VSCODE.postMessage({ type: 'ready' });

        return () => {
            window.removeEventListener('message', () => {});
        };
    }, []);

    const makeEdit: EditorContextProps['makeEdit'] = (edit) => {
        setScene((currScene) => {
            if (!currScene) return currScene;
            applyEdit(currScene, edit);
            VSCODE.postMessage(edit);
            return currScene;
        });
    };

    return (
        <EditorContext.Provider
            value={{ editable, fileName, scene, validFile, makeEdit }}
        >
            {children}
        </EditorContext.Provider>
    );
}

export const useEditor = () => {
    const context = useContext(EditorContext);
    if (!context) {
        throw new Error('useApp must be used within a AppProvider');
    }
    return context;
};
