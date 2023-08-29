import './App.css';
import EditorWrapper from './components/EditorWrapper';
import SceneGrid from './components/SceneGrid';
import SidePanel from './components/SidePanel';

function App() {
    return (
        <EditorWrapper>
            <SceneGrid />
            <SidePanel />
        </EditorWrapper>
    );
}

export default App;
