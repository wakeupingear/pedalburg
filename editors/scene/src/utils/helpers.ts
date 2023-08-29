export function setValue(obj: any, path: string, value: any) {
    const a = path.split('.');
    let o = obj;
    while (a.length - 1) {
        const n = a.shift() as string;
        if (!(n in o)) o[n] = {};
        o = o[n];
    }
    o[a[0]] = value;
}

export function getValue(obj: any, path: string) {
    path = path.replace(/\[(\w+)\]/g, '.$1');
    path = path.replace(/^\./, '');
    const a = path.split('.');
    let o = obj;
    while (a.length) {
        const n = a.shift() as string;
        if (!(n in o)) return;
        o = o[n];
    }
    return o;
}

export function deleteValue(obj: any, path: string) {
    const a = path.split('.');
    let o = obj;
    while (a.length - 1) {
        const n = a.shift() as string;
        if (!(n in o)) return;
        o = o[n];
    }
    o.splice(a[0], 1);
}

export function insertValue(obj: any, path: string, value: any) {
    const a = path.split('.');
    let o = obj;
    while (a.length - 1) {
        const n = a.shift() as string;
        if (!(n in o)) return;
        o = o[n];
    }
    o.splice(a[0], 0, value);
}