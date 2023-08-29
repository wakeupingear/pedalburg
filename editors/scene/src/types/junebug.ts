export type Layer = {
    id: string;
    depth?: number;
    name?: string;
};

export type Actor = {
    type: string;
    id?: string;
    layer?: string;
    sprite?: string;
    scale?: number | [number, number];
    pos?: [number, number];
};

export type Scene = {
    size: [number, number];
    actors?: Actor[];
    gravity?: [number, number];
    layers?: Layer[];
};
