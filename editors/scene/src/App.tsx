import './App.css';
import Grid from './components/Grid';
import { Scene } from './types/junebug';

const TEST_SCENE: Scene = {
    size: [384, 216],
};

function App() {
    return <Grid scene={TEST_SCENE} />;
}

export default App;
