import Grid from './Grid';
import { useEditor } from './EditorWrapper';
import { useEffect, useRef } from 'react';
import { Scene } from '../types/junebug';
import { COL_BREADCRUMB_FOREGROUND } from '../utils/vscode';

export default function SceneGrid() {
    const { scene: _scene, validFile, makeEdit } = useEditor();
    const sceneRef = useRef<Scene | null>(_scene);
    useEffect(() => {
        sceneRef.current = _scene;
    }, [_scene]);

    const selectedActor = useRef<{
        id: string | null;
        offset: [number, number] | null;
        start: [number, number] | null;
        isDragging: boolean;
    }>({
        id: null,
        offset: null,
        start: null,
        isDragging: false,
    });

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
            scene={sceneRef}
            draw={({
                drawRect,
                scene,
                mouse,
                keyboard,
                ctx,
                canvasSize,
                canvasToCoord,
            }) => {
                if (scene.current) {
                    const { size, actors = [] } = scene.current;

                    // Draw background
                    drawRect(0, 0, size[0], size[1], {
                        fill: COL_BREADCRUMB_FOREGROUND,
                    });

                    // Determine what actor is being hovered
                    const mouseCoord = canvasToCoord(
                        mouse.current.x,
                        mouse.current.y
                    );
                    let hoveredActor: number | null = selectedActor.current
                        .isDragging
                        ? actors.findIndex(
                              (actor) => actor.id === selectedActor.current.id
                          )
                        : null;
                    if (hoveredActor == null)
                        actors.forEach((actor, i) => {
                            if (mouse.current.drag || !actor.pos || !actor.id)
                                return;

                            const tl = [...actor.pos],
                                br = [actor.pos[0] + 20, actor.pos[1] + 20];

                            if (
                                mouseCoord.x >= tl[0] &&
                                mouseCoord.x <= br[0] &&
                                mouseCoord.y >= tl[1] &&
                                mouseCoord.y <= br[1]
                            ) {
                                hoveredActor = i;
                            }
                        });

                    // Process interactions on hovered actor
                    if (hoveredActor !== null) {
                        const actor = actors[hoveredActor];
                        if (actor.id && actor.pos) {
                            if (mouse.current.button === 'left') {
                                selectedActor.current.id = actor.id;

                                if (mouse.current.time === 1) {
                                    selectedActor.current.offset = [
                                        actor.pos[0] - mouseCoord.x,
                                        actor.pos[1] - mouseCoord.y,
                                    ];
                                    selectedActor.current.start = [
                                        ...actor.pos,
                                    ];
                                } else {
                                    if (selectedActor.current.offset) {
                                        if (!selectedActor.current.isDragging) {
                                            const currOffset = [
                                                actor.pos[0] - mouseCoord.x,
                                                actor.pos[1] - mouseCoord.y,
                                            ];
                                            const diff = [
                                                currOffset[0] -
                                                    selectedActor.current
                                                        .offset[0],
                                                currOffset[1] -
                                                    selectedActor.current
                                                        .offset[1],
                                            ];
                                            const dist = Math.sqrt(
                                                diff[0] * diff[0] +
                                                    diff[1] * diff[1]
                                            );
                                            selectedActor.current.isDragging =
                                                dist > 2;
                                        }

                                        if (selectedActor.current.isDragging) {
                                            actor.pos = [
                                                mouseCoord.x +
                                                    selectedActor.current
                                                        .offset[0],
                                                mouseCoord.y +
                                                    selectedActor.current
                                                        .offset[1],
                                            ];
                                            actor.pos[0] = Math.round(
                                                actor.pos[0]
                                            );
                                            actor.pos[1] = Math.round(
                                                actor.pos[1]
                                            );
                                        }
                                    }
                                }
                            }
                        }
                    } else {
                        if (mouse.current.button === 'left') {
                            selectedActor.current.id = null;
                        }
                    }

                    // Process interactions on selected actor
                    if (
                        selectedActor.current.id &&
                        hoveredActor !== null &&
                        sceneRef.current?.actors
                    ) {
                        // Check if actor was just dragged
                        const justWasDragging =
                            selectedActor.current.isDragging;
                        selectedActor.current.isDragging =
                            selectedActor.current.isDragging &&
                            mouse.current.button === 'left';
                        if (
                            justWasDragging &&
                            !selectedActor.current.isDragging &&
                            sceneRef.current?.actors
                        ) {
                            makeEdit({
                                type: 'update',
                                path: `actors.${hoveredActor}`,
                                newValue: actors[hoveredActor],
                                oldValue: sceneRef.current.actors[hoveredActor],
                            });
                        }

                        // Check if actor should be deleted
                        if (
                            !justWasDragging &&
                            (keyboard.current['Backspace'] ||
                                keyboard.current['Delete'])
                        ) {
                            makeEdit({
                                type: 'delete',
                                path: `actors.${hoveredActor}`,
                                oldValue: sceneRef.current.actors[hoveredActor],
                            });
                        }
                    }

                    // Draw actors
                    actors.forEach((actor, i) => {
                        const { id, pos } = actor;
                        if (pos) {
                            drawRect(pos[0], pos[1], 20, 20, {
                                fill:
                                    hoveredActor === i ||
                                    selectedActor.current.id === id
                                        ? 'red'
                                        : 'white',
                            });
                        }
                    });

                    if (canvasSize) {
                        ctx.fillStyle = 'white';
                        ctx.font = '12px monospace';
                        const coord = canvasToCoord(
                            mouse.current.x,
                            mouse.current.y
                        );
                        ctx.fillText(
                            `${Math.round(coord.x)}, ${Math.round(coord.y)}`,
                            8,
                            canvasSize.y - 8
                        );
                    }
                }

                return {
                    mouseCapture: Boolean(selectedActor.current?.id !== null),
                };
            }}
        />
    );
}
