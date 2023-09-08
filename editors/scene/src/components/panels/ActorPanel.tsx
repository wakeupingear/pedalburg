import React from 'react';
import { useEditor } from '../EditorWrapper';

export default function ActorPanel() {
    const { selectedActor } = useEditor();

    if (!selectedActor) return null;

    const { id, pos } = selectedActor;

    return (
        <>
            <h2 className="text-xl">Actor {id}</h2>

            <h2 className="mt-auto">
                {pos[0]}, {pos[1]}
            </h2>
        </>
    );
}
