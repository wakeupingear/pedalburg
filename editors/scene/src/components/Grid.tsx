import { useRef, useEffect, MutableRefObject, KeyboardEvent } from 'react';
import { Vector } from '../types/math';
import { Scene } from '../types/junebug';
import { COL_EDITOR_TABS_BACKGROUND } from '../utils/vscode';
import { PANEL_WIDTH } from './SidePanel';

const VIEW_BORDER = 2;
const SCENE_PADDING = 36;

const MOUSE_MOTION_EVENTS = ['mousedown', 'mouseup', 'mousemove'];
const KEYBOARD_EVENTS = ['keydown', 'keyup'];
const MIN_SCALE = 0.25,
    MAX_SCALE = 2.5;

interface Mouse {
    x: number;
    y: number;
    button: 'left' | 'right' | 'middle' | null;
    time: number;
    wheel: number;
    lastX: number;
    lastY: number;
    drag: boolean;
}

type Keyboard = Partial<Record<KeyboardEvent['key'], number>>;

interface DrawArgs {
    fill: string;
    strokeStyle: string;
    lineWidth: number;
    alpha: number;
}

interface GridHelpers {
    canvasSize?: Vector;
    ctx: CanvasRenderingContext2D;
    mouse: MutableRefObject<Mouse>;
    keyboard: MutableRefObject<Keyboard>;
    scene: MutableRefObject<Scene | null>;
    coordToCanvas: (x: number, y: number) => Vector;
    canvasToCoord: (x: number, y: number) => Vector;
    drawRect: (
        x: number,
        y: number,
        w: number,
        h: number,
        args?: Partial<DrawArgs>
    ) => void;
}

interface GridProps {
    scene: MutableRefObject<Scene | null>;
    draw?: (helpers: GridHelpers) => {
        mouseCapture?: boolean;
    };
    scale?: number;
    scaleRate?: number;
    tileSize?: number;
}

export default function Grid({
    scene,
    draw: externalDraw,
    scale: _scale = 1,
    scaleRate: __scaleRate = 1.02,
    tileSize: __tileSize = 16,
}: GridProps) {
    const _tileSize = useRef(__tileSize);
    const _scaleRate = useRef(__scaleRate);
    const _mouse = useRef<Mouse>({
        x: 0,
        y: 0,
        button: null,
        time: 0,
        wheel: 0,
        lastX: 0,
        lastY: 0,
        drag: false,
    });
    const _keyboard = useRef<Keyboard>({});
    const _topLeft = useRef({ x: 400, y: 0 });
    const _panZoom = useRef({
        x: 0,
        y: 0,
        scale: _scale,
        apply(ctx: CanvasRenderingContext2D) {
            ctx.setTransform(this.scale, 0, 0, this.scale, this.x, this.y);
        },
        scaleAt(x: number, y: number, sc: number) {
            // x & y are screen coords, not world
            const newScale = Math.max(
                MIN_SCALE,
                Math.min(MAX_SCALE, this.scale * sc)
            );
            if (newScale === this.scale) return;

            this.scale = newScale;
            this.x = x - (x - this.x) * sc;
            this.y = y - (y - this.y) * sc;
        },
    });

    const canvasRef = useRef<HTMLCanvasElement>(null);

    const canvasToCoord = (x: number, y: number) => {
        const inv = 1 / _panZoom.current.scale;
        return {
            x: (x - _panZoom.current.x) * inv,
            y: (y - _panZoom.current.y) * inv,
        };
    };

    const coordToCanvas = (x: number, y: number) => {
        return {
            x: x * _panZoom.current.scale + _panZoom.current.x,
            y: y * _panZoom.current.scale + _panZoom.current.y,
        };
    };

    useEffect(() => {
        if (!scene.current) return;

        const { size } = scene.current;
        if (size) {
            const xScale =
                    (window.innerWidth - SCENE_PADDING * 2 - PANEL_WIDTH) /
                    size[0],
                yScale = (window.innerHeight - SCENE_PADDING * 2) / size[1];
            _panZoom.current.scale = Math.min(xScale, yScale);
            _panZoom.current.x =
                SCENE_PADDING +
                ((xScale - _panZoom.current.scale) * size[0]) / 2;
            _panZoom.current.y =
                SCENE_PADDING +
                ((yScale - _panZoom.current.scale) * size[1]) / 2;
        }
    }, [scene]);

    const helpers = useRef<GridHelpers>({
        ctx: null as unknown as CanvasRenderingContext2D,
        mouse: _mouse,
        keyboard: _keyboard,
        drawRect: (x, y, w, h, args) => {
            const ctx = helpers.current.ctx;

            const width = args?.lineWidth ?? 1;
            x = Math.round(x + width / 2);
            y = Math.round(y + width / 2);
            w = Math.round(w - width);
            h = Math.round(h - width);
            ctx.lineWidth = width * _panZoom.current.scale;
            ctx.globalAlpha = args?.alpha ?? 1;

            ctx.beginPath();
            const { x: x1, y: y1 } = coordToCanvas(x, y);
            const { x: x2, y: y2 } = coordToCanvas(x + w, y + h);

            if (args?.fill) {
                ctx.fillStyle = args?.fill;
                ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
            } else {
                ctx.rect(x1, y1, x2 - x1, y2 - y1);
            }

            if (args?.strokeStyle) {
                ctx.strokeStyle = args.strokeStyle;
                ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
            }

            ctx.stroke();
        },
        coordToCanvas,
        canvasToCoord,
        scene,
    });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Mouse events
        const mouseEvents = (e: any) => {
            if (!canvasRef.current) return;

            const mouse = _mouse.current;
            const bounds = canvasRef.current.getBoundingClientRect();
            mouse.x = e.pageX - bounds.left - scrollX;
            mouse.y = e.pageY - bounds.top - scrollY;
            if (e.type === 'mousedown' || e.type === 'mouseup') {
                mouse.button =
                    e.button === 0
                        ? 'left'
                        : e.button === 1
                        ? 'middle'
                        : 'right';
                if (e.type === 'mouseup') {
                    mouse.button = null;
                }
                mouse.time = 0;
            }

            if (e.type === 'wheel') {
                mouse.wheel += -e.deltaY;
                e.preventDefault();
            }

            _mouse.current = mouse;
        };
        MOUSE_MOTION_EVENTS.forEach((name) =>
            document.addEventListener(name, mouseEvents)
        );
        document.addEventListener('wheel', mouseEvents, { passive: false });

        // KEyboard events
        const keyboardEvents = (e: any) => {
            _keyboard.current[e.key] = e.type === 'keydown' ? 1 : 0;
        };
        KEYBOARD_EVENTS.forEach((name) =>
            document.addEventListener(name, keyboardEvents)
        );

        // Main grid draw function
        let animationFrameId: number;
        const draw = () => {
            const w = window.innerWidth - VIEW_BORDER * 2,
                h = window.innerHeight - VIEW_BORDER * 2;
            canvas.width = w;
            canvas.height = h;
            helpers.current.canvasSize = { x: w, y: h };

            const gridScale = _tileSize.current,
                panZoom = _panZoom.current;
            let x = 0,
                y = 0;

            let wScaled = w / panZoom.scale + gridScale * 2,
                hScaled = h / panZoom.scale + gridScale * 2;
            const { x: tlX, y: tlY } = canvasToCoord(0, 0);
            _topLeft.current.x = tlX;
            _topLeft.current.y = tlY;
            x = Math.floor(tlX / gridScale) * gridScale;
            y = Math.floor(tlY / gridScale) * gridScale;

            if (scene.current) {
                if (wScaled / gridScale > scene.current.size[0]) {
                    wScaled = gridScale * scene.current.size[0];
                }
                if (hScaled / gridScale > scene.current.size[1]) {
                    hScaled = gridScale * scene.current.size[1];
                }
            }

            const size = Math.max(wScaled, hScaled);
            _panZoom.current.apply(ctx);

            // Draw grid
            ctx.lineWidth = 1;
            ctx.strokeStyle = COL_EDITOR_TABS_BACKGROUND;
            ctx.beginPath();
            for (let i = 0; i < size; i += gridScale) {
                ctx.moveTo(x + i, y);
                ctx.lineTo(x + i, y + size);
                ctx.moveTo(x, y + i);
                ctx.lineTo(x + size, y + i);
            }
            ctx.setTransform(1, 0, 0, 1, 0, 0); // reset the transform so the lineWidth is 1
            ctx.stroke();

            // Draw axis
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#000';
            const { x: x1, y: y1 } = coordToCanvas(0, 0);
            ctx.beginPath();
            ctx.moveTo(x1, 0);
            ctx.lineTo(x1, h);
            ctx.moveTo(0, y1);
            ctx.lineTo(w, y1);
            ctx.stroke();

            helpers.current.ctx = ctx;
            return externalDraw?.(helpers.current);
        };

        // Initialize animation loop
        const update = () => {
            const { innerWidth, innerHeight } = window;
            let w = innerWidth,
                h = innerHeight;

            const mouse = _mouse.current,
                scaleRate = _scaleRate.current;

            ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform
            ctx.globalAlpha = 1; // reset alpha
            if (w !== innerWidth || h !== innerHeight) {
                w = canvas.width = innerWidth;
                h = canvas.height = innerHeight;
            } else {
                ctx.clearRect(0, 0, w, h);
            }

            if (mouse.wheel !== 0) {
                let scale = 1;
                scale = mouse.wheel < 0 ? 1 / scaleRate : scaleRate;
                _mouse.current.wheel *= 0.8;
                if (Math.abs(mouse.wheel) < 1) {
                    _mouse.current.wheel = 0;
                }
                _panZoom.current.scaleAt(mouse.x, mouse.y, scale); //scale is the change in scale
            }

            if (_mouse.current.button) {
                _mouse.current.time++;
            }

            const { mouseCapture } = draw() || {};

            if (!mouseCapture) {
                if (mouse.button === 'left' || mouse.button === 'middle') {
                    if (!mouse.drag) {
                        _mouse.current.lastX = mouse.x;
                        _mouse.current.lastY = mouse.y;
                        _mouse.current.drag = true;
                    } else {
                        _panZoom.current.x += mouse.x - mouse.lastX;
                        _panZoom.current.y += mouse.y - mouse.lastY;
                        _mouse.current.lastX = mouse.x;
                        _mouse.current.lastY = mouse.y;
                    }
                } else if (mouse.drag) {
                    _mouse.current.drag = false;
                }
            }

            animationFrameId = window.requestAnimationFrame(update);
        };
        update();

        // Cleanup
        return () => {
            window.cancelAnimationFrame(animationFrameId);

            MOUSE_MOTION_EVENTS.forEach((name) => {
                document.removeEventListener(name, mouseEvents);
            });
            document.removeEventListener('wheel', mouseEvents);
            KEYBOARD_EVENTS.forEach((name) => {
                document.removeEventListener(name, keyboardEvents);
            });
        };
    }, [canvasRef]);

    return <canvas ref={canvasRef} />;
}
