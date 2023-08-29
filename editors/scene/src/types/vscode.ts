interface InsertEdit {
    readonly type: 'insert';
    readonly path: string;
    readonly newValue: any;
}

interface DeleteEdit {
    readonly type: 'delete';
    readonly path: string;
    readonly oldValue: any;
}

interface UpdateEdit {
    readonly type: 'update';
    readonly path: string;
    readonly oldValue: any;
    readonly newValue: any;
}

export type SceneEdit = InsertEdit | DeleteEdit | UpdateEdit;
