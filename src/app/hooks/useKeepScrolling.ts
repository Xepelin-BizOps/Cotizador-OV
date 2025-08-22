import { useEffect, useRef } from "react";

interface Props {
    searchParams: string | null;
    isbehavior?: boolean
}

export default function useKeepScrolling({ searchParams, isbehavior = false }: Props) {

    // const inputRef = useRef<InputRef>(null);
    const elementRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Al actualizar resultados, hacemos scroll
        if (searchParams) {
            elementRef.current?.scrollIntoView({
                behavior: isbehavior ? "smooth" : "instant",
                block: "start",
            });
        }
    }, [searchParams, isbehavior]);


    return {
        elementRef
    }
}
