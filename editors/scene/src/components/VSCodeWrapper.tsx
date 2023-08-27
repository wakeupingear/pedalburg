import { ReactNode, useEffect } from 'react';

interface VSCodeProps {
    children: ReactNode;
}

export default function VSCodeWrapper({ children }: VSCodeProps) {
    useEffect(() => {
    }, []);

    return children;
}
