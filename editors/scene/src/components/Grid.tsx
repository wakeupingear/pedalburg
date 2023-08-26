import { useRef, useEffect } from 'react';
import { Vector } from '../types/math';
import { Scene } from '../types/junebug';

const MOUSE_MOTION_EVENTS = ['mousedown', 'mouseup', 'mousemove'];
const MIN_SCALE = 0.25,
    MAX_SCALE = 2.5;

interface Mouse {
    x: number;
    y: number;
    button: 'left' | 'right' | 'middle' | null;
    wheel: number;
    lastX: number;
    lastY: number;
    drag: boolean;
}

interface GridProps {
    scene: Scene;
    draw?: (ctx: CanvasRenderingContext2D) => void;
    scale?: number;
    scaleRate?: number;
    tileSize?: number;
}

export default function Grid({
    scene,
    draw: externalDraw,
    scale: _scale = 1,
    scaleRate: __scaleRate = 1.02,
    tileSize: __tileSize = 36,
}: GridProps) {
    const _tileSize = useRef(__tileSize);
    const _scaleRate = useRef(__scaleRate);
    const _mouse = useRef<Mouse>({
        x: 0,
        y: 0,
        button: null,
        wheel: 0,
        lastX: 0,
        lastY: 0,
        drag: false,
    });
    const _topLeft = useRef({ x: 0, y: 0 });
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
        toWorld(x: number, y: number, point: Partial<Vector> = {}): Vector {
            // converts from screen coords to world coords
            const inv = 1 / this.scale;
            point.x = (x - this.x) * inv;
            point.y = (y - this.y) * inv;
            return point as Vector;
        },
    });

    const canvasRef = useRef<HTMLCanvasElement>(null);

    // eslint-disable-next-line
    function mouseEvents(e: any) {
        if (!canvasRef.current) return;

        const mouse = _mouse.current;
        const bounds = canvasRef.current.getBoundingClientRect();
        mouse.x = e.pageX - bounds.left - scrollX;
        mouse.y = e.pageY - bounds.top - scrollY;
        if (e.type === 'mousedown' || e.type === 'mouseup') {
            mouse.button =
                e.button === 0 ? 'left' : e.button === 1 ? 'middle' : 'right';
            if (e.type === 'mouseup') {
                mouse.button = null;
            }
        }

        if (e.type === 'wheel') {
            mouse.wheel += -e.deltaY;
            e.preventDefault();
        }
    }

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Add event listeners for mouse events
        MOUSE_MOTION_EVENTS.forEach((name) =>
            document.addEventListener(name, mouseEvents)
        );
        document.addEventListener('wheel', mouseEvents, { passive: false });

        // Main draw function
        let animationFrameId: number;
        const draw = () => {
            const w = window.innerWidth,
                h = window.innerHeight;
            canvas.width = w;
            canvas.height = h;

            const gridScale = _tileSize.current,
                panZoom = _panZoom.current,
                topLeft = _topLeft.current;
            let x = 0,
                y = 0;

            let wScaled = w / panZoom.scale + gridScale * 2,
                hScaled = h / panZoom.scale + gridScale * 2;
            _panZoom.current.toWorld(0, 0, topLeft);
            x = Math.floor(topLeft.x / gridScale) * gridScale;
            y = Math.floor(topLeft.y / gridScale) * gridScale;

            if (wScaled / gridScale > scene.size[0]) {
                wScaled = gridScale * scene.size[0];
            }
            if (hScaled / gridScale > scene.size[1]) {
                hScaled = gridScale * scene.size[1];
            }
            const size = Math.max(wScaled, hScaled);

            _panZoom.current.apply(ctx);
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#000';
            ctx.beginPath();
            for (let i = 0; i < size; i += gridScale) {
                ctx.moveTo(x + i, y);
                ctx.lineTo(x + i, y + size);
                ctx.moveTo(x, y + i);
                ctx.lineTo(x + size, y + i);
            }
            ctx.setTransform(1, 0, 0, 1, 0, 0); // reset the transform so the lineWidth is 1
            ctx.stroke();

            externalDraw?.(ctx);
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

            draw();

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
        };
    }, [canvasRef]);

    return <canvas ref={canvasRef} />;
}
