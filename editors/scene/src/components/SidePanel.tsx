import clsx from 'clsx';
import { useEditor } from './EditorWrapper';
import ActorPanel from './panels/ActorPanel';
import ScenePanel from './panels/ScenePanel';
import { useState } from 'react';

export const PANEL_WIDTH = 144;

type Category = 'scene' | 'actor';

export default function SidePanel() {
    const { selectedActorId, panelsInteractable } = useEditor();

    const [pinnedCategory, setPinnedCategory] = useState<Category | null>(null);
    const category = pinnedCategory || (selectedActorId ? 'actor' : 'scene');
    console.log(pinnedCategory, selectedActorId, category);

    return (
        <div
            className={clsx(
                'p-2 absolute right-0 top-0 flex flex-col w-36 h-full bg-[var(--vscode-editor-background)] border-l-2 border-l-[var(--vscode-editorGroupHeader-tabsBackground)]',
                {
                    'pointer-events-none': !panelsInteractable,
                }
            )}
        >
            <button
                onClick={() =>
                    setPinnedCategory(pinnedCategory ? null : category)
                }
                className="py-1 px-2 ml-auto w-min"
            >
                {pinnedCategory ? 'Unpin' : 'Pin'}
            </button>
            {category === 'actor' && <ActorPanel />}
            {category === 'scene' && <ScenePanel />}
        </div>
    );
}
