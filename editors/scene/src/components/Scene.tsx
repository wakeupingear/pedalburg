import Grid from './Grid';
import { Scene } from '../types/junebug';

const TEST_SCENE: Scene = {
    size: [384, 216],
};
export default function Scene() {
    return (
        <Grid
            scene={TEST_SCENE}
            draw={({ drawRect, scene: { size } }) => {
                drawRect(0, 0, size[0], size[1], {
                    fill: 'blue',
                    lineWidth: 20,
                });
            }}
        />
    );
}
