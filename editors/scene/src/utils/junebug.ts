import { Actor, Scene } from '../types/junebug';
import { SceneEdit } from '../types/vscode';
import { deleteValue, insertValue, setValue } from './helpers';

export const processInitialScene = (scene: Scene): Scene => {
    scene.actors = (scene.actors || []).reduce((acc, actor) => {
        if (!actor.type) return acc;

        if (!actor.id) {
            actor.id = Math.random().toString(36).substring(2, 10);
        }

        acc.push(actor);
        return acc;
    }, [] as Actor[]);

    return scene;
};

export const applyEdit = (scene: Scene, edit: SceneEdit): Scene => {
    switch (edit.type) {
        case 'insert':
            insertValue(scene, edit.path, edit.newValue);
            break;
        case 'delete':
            deleteValue(scene, edit.path);
            break;
        case 'update':
            setValue(scene, edit.path, edit.newValue);
            break;
    }

    return scene;
};
