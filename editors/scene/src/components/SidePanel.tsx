import React, { useEffect, useState } from 'react';
import { useEditor } from './EditorWrapper';

export default function SidePanel() {
    const { validFile, scene, makeEdit } = useEditor();

    const [size, setSize] = useState(scene?.size || null);
    const [changed, setChanged] = useState(false);
    useEffect(() => {
        if (scene) {
            setSize(scene.size);
            setChanged(false);
        }
    }, [scene]);

    if (!validFile || !scene) return null;

    const saveEdit = () => {
        if (!changed || !size || size[0] <= 0 || size[1] <= 0) return;

        makeEdit({
            type: 'update',
            oldValue: scene.size,
            newValue: size,
            path: 'size',
        });
        setChanged(false);
    };

    return (
        <div className="p-2 absolute right-0 top-0 flex flex-col w-36 h-full bg-[var(--vscode-editor-background)] border-l-2 border-l-[var(--vscode-editorGroupHeader-tabsBackground)]">
            {size && (
                <>
                    <h2 className="mt-auto">Scene Size</h2>
                    <div className="gap-2 flex mt-2">
                        <input
                            type="number"
                            value={size[0]}
                            onChange={(e) => {
                                setSize([Number(e.target.value), size[1]]);
                                setChanged(true);
                            }}
                            onBlur={saveEdit}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    saveEdit();
                                }
                            }}
                        />
                        X
                        <input
                            type="number"
                            value={size[1]}
                            onChange={(e) => {
                                setSize([size[0], Number(e.target.value)]);
                                setChanged(true);
                            }}
                            onBlur={saveEdit}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    saveEdit();
                                }
                            }}
                        />
                    </div>
                </>
            )}
        </div>
    );
}
