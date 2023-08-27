import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    build: {
        outDir: '../../out/editors/scene',
        emptyOutDir: true,
        rollupOptions: {
            output: {
                entryFileNames: `assets/vscode.js`,
                assetFileNames: `assets/vscode.[ext]`,
            },
        },
    },
    base: 'http://localhost:5555/',
    server: {
        port: 5555,
        cors: true,
    },
});
