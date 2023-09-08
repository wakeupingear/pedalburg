import Grid from './Grid';
import { useEditor } from './EditorWrapper';
import { useEffect, useRef } from 'react';
import { Scene } from '../types/junebug';
import { COL_BREADCRUMB_FOREGROUND } from '../utils/vscode';

export default function SceneGrid() {
    const {
        scene: _scene,
        validFile,
        makeEdit,
        setSelectedActorId,
    } = useEditor();
    const sceneRef = useRef<Scene | null>(_scene);
    useEffect(() => {
        sceneRef.current = _scene;
    }, [_scene]);

    const selectedActor = useRef<{
        id: string | null;
        index: number | null;
        offset: [number, number] | null;
        start: [number, number] | null;
        isDragging: boolean;
    }>({
        id: null,
        index: null,
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
                coordToCanvas,
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
                        ? selectedActor.current.index
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
                        if (mouse.current.button === 'left') {
                            selectedActor.current.id = actor.id;
                            selectedActor.current.index = hoveredActor;

                            if (mouse.current.time === 1) {
                                selectedActor.current.offset = [
                                    actor.pos[0] - mouseCoord.x,
                                    actor.pos[1] - mouseCoord.y,
                                ];
                                selectedActor.current.start = [...actor.pos];

                                setSelectedActorId(actor.id);
                            } else {
                                if (selectedActor.current.offset) {
                                    if (!selectedActor.current.isDragging) {
                                        const currOffset = [
                                            actor.pos[0] - mouseCoord.x,
                                            actor.pos[1] - mouseCoord.y,
                                        ];
                                        const diff = [
                                            currOffset[0] -
                                                selectedActor.current.offset[0],
                                            currOffset[1] -
                                                selectedActor.current.offset[1],
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
                                                selectedActor.current.offset[0],
                                            mouseCoord.y +
                                                selectedActor.current.offset[1],
                                        ];
                                        actor.pos[0] = Math.round(actor.pos[0]);
                                        actor.pos[1] = Math.round(actor.pos[1]);
                                    }
                                }
                            }
                        }
                    } else {
                        if (mouse.current.button === 'left') {
                            selectedActor.current.id = null;
                            setSelectedActorId(null);
                        }
                    }

                    // Process interactions on selected actor
                    if (
                        selectedActor.current.index &&
                        selectedActor.current.id &&
                        sceneRef.current?.actors
                    ) {
                        const { isDragging, index } = selectedActor.current;
                        // Check if actor was just dragged
                        const justWasDragging = isDragging;
                        selectedActor.current.isDragging =
                            isDragging && mouse.current.button === 'left';
                        if (
                            justWasDragging &&
                            !selectedActor.current.isDragging
                        ) {
                            makeEdit({
                                type: 'update',
                                path: `actors.${selectedActor.current.index}`,
                                newValue: actors[index],
                                oldValue: sceneRef.current.actors[index],
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
                                path: `actors.${index}`,
                                oldValue: sceneRef.current.actors[index],
                            });

                            selectedActor.current.id = null;
                            setSelectedActorId(null);
                        }
                    }

                    // Draw actors
                    actors.forEach((actor, i) => {
                        const { id, pos } = actor;
                        const isSelected = selectedActor.current.id === id;
                        if (pos) {
                            drawRect(pos[0], pos[1], 20, 20, {
                                fill: isSelected ? 'red' : 'white',
                                lineWidth: hoveredActor === i ? 2 : 0,
                                strokeStyle:
                                    hoveredActor === i ? 'blue' : undefined,
                            });

                            if (
                                isSelected &&
                                (selectedActor.current.isDragging ||
                                    hoveredActor === i)
                            ) {
                                // draw text
                                ctx.fillStyle = 'white';
                                ctx.font = '12px monospace';
                                const coord = coordToCanvas(pos[0], pos[1] - 4);
                                ctx.fillText(
                                    `${Math.round(pos[0])}, ${Math.round(
                                        pos[1]
                                    )}`,
                                    coord.x,
                                    coord.y
                                );
                            }
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
