import Grid from './Grid';
import { useEditor } from './EditorWrapper';
import { useEffect, useRef } from 'react';
import { Scene } from '../types/junebug';

export default function SceneGrid() {
    const { scene: _scene, validFile } = useEditor();
    const scene = useRef<Scene | null>(_scene);
    useEffect(() => {
        scene.current = _scene;
    }, [_scene]);

    if (!validFile)
        return (
            <div className="w-full gap-4 my-auto flex flex-col items-center">
                <h1>Invalid file!</h1>
                <p>Only valid JSON data can be used as a Junebug Scene</p>
            </div>
        );

    if (!_scene) return null;

    return (
        <Grid
            scene={scene}
            draw={({ drawRect, scene }) => {
                if (scene.current) {
                    const { size, actors = [] } = scene.current;

                    drawRect(0, 0, size[0], size[1], {
                        fill: 'blue',
                        lineWidth: 20,
                    });

                    actors.forEach((actor) => {
                        const { pos } = actor;
                        if (pos) {
                            drawRect(pos[0], pos[1], 20, 20, {
                                fill: 'red',
                            });
                        }
                    });
                }
            }}
        />
    );
}
