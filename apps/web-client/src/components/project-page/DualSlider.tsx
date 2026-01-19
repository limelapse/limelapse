import React, { useRef, useState, useEffect, useCallback } from "react";

type Props = {
    start?: number; // defined in [0, 1]
    end?: number; // defined in [0, 1]
    onRangeChange?: (left: number, right: number) => void;
    ref?: {
        left: React.RefObject<HTMLDivElement | null>;
        right: React.RefObject<HTMLDivElement | null>;
    };
};

export default function DualSlider({
    start = 0,
    end = 1,
    onRangeChange,
    ref,
}: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const localLeft = useRef<HTMLDivElement>(null);
    const localRight = useRef<HTMLDivElement>(null);
    const leftHandle = ref?.left ?? localLeft;
    const rightHandle = ref?.right ?? localRight;
    const middle = useRef<HTMLDivElement>(null);
    const handles = useRef<HTMLDivElement>(null);
    const [dragging, setDragging] = useState<
        "left" | "right" | "center" | null
    >(null);
    const [containerWidth, setContainerWidth] = useState(1);

    const [range, setRange] = useState<[number, number]>([start, end]);

    useEffect(() => {
        setRange([start, end]);
    }, [start, end]);

    useEffect(() => {
        const [left, right] = range;
        onRangeChange?.(left, right);
    }, [range]);

    useEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.offsetWidth);
            }
        };
        updateWidth();
        window.addEventListener("resize", updateWidth);
        return () => {
            window.removeEventListener("resize", updateWidth);
        };
    }, []);

    const handleMouseMoveLeft = useCallback(
        (e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (!containerRef.current) return;

            const rect = containerRef.current.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const percent = mouseX / containerWidth;

            setRange(([_, endP]) => {
                const range: [number, number] = [
                    Math.max(0, Math.min(percent, endP - 0.01)),
                    endP,
                ];
                return range;
            });
        },
        [containerWidth],
    );

    const handleMouseMoveRight = useCallback(
        (e: MouseEvent) => {
            if (!containerRef.current) return;

            const rect = containerRef.current.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const percent = mouseX / containerWidth;

            setRange(([startP, _]) => {
                const range: [number, number] = [
                    startP,
                    Math.min(1, Math.max(percent, startP + 0.01)),
                ];
                return range;
            });
        },
        [containerWidth],
    );

    const handleMouseMoveCenter = useCallback(
        (delta: number) => (e: MouseEvent) => {
            if (!containerRef.current) return;

            const rect = containerRef.current.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const percent = mouseX / containerWidth;

            setRange(([startP, endP]) => {
                const width = endP - startP;
                const newStart = Math.max(
                    0,
                    Math.min(percent - delta, 1 - width),
                );
                const range: [number, number] = [newStart, newStart + width];
                return range;
            });
        },
        [containerWidth],
    );

    return (
        <div
            ref={containerRef}
            className="relative h-6 overflow-hidden rounded"
        >
            <div
                ref={handles}
                className={`absolute top-0 h-full bg-white/30 border rounded cursor-grab ${dragging ? "border-blue-300" : "border-gray-300 "}`}
                style={{
                    left: range[0] * containerWidth,
                    width: (range[1] - range[0]) * containerWidth,
                }}
            >
                <div
                    ref={leftHandle}
                    className={`absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize rounded border-1 ${dragging === "left" || dragging === "center" ? "bg-blue-200 border-blue-700" : "bg-gray-300 border-gray-600 hover:bg-gray-400"}`}
                    onPointerDown={(e) => {
                        if (!leftHandle.current) return;
                        setDragging("left");
                        leftHandle.current!.onpointermove = handleMouseMoveLeft;
                        leftHandle.current!.setPointerCapture(e.pointerId);
                    }}
                    onPointerUp={(e) => {
                        if (!leftHandle.current) return;
                        setDragging(null);
                        leftHandle.current!.onpointermove = null;
                        leftHandle.current!.releasePointerCapture(e.pointerId);
                    }}
                />
                <div
                    ref={middle}
                    className={`mx-2 h-full`}
                    onPointerDown={(e) => {
                        if (!middle.current) return;
                        if (!containerRef.current) return;
                        setDragging("center");
                        const rect =
                            containerRef.current.getBoundingClientRect();
                        const mouseX = e.clientX - rect.left;
                        const percent = mouseX / containerWidth;

                        middle.current.onpointermove = handleMouseMoveCenter(
                            percent - range[0],
                        ); // distance from leftHandle to mouse position in percentage
                        middle.current.setPointerCapture(e.pointerId);
                    }}
                    onPointerUp={(e) => {
                        if (!middle.current) return;
                        setDragging(null);
                        middle.current.onpointermove = null;
                        middle.current.releasePointerCapture(e.pointerId);
                    }}
                ></div>
                <div
                    ref={rightHandle}
                    className={`absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize rounded border-1 ${dragging === "right" || dragging === "center" ? "bg-blue-200 border-blue-700" : "bg-gray-300 border-gray-600 hover:bg-gray-400 "}`}
                    onPointerDown={(e) => {
                        if (!rightHandle.current) return;
                        setDragging("right");
                        rightHandle.current!.onpointermove =
                            handleMouseMoveRight;
                        rightHandle.current!.setPointerCapture(e.pointerId);
                    }}
                    onPointerUp={(e) => {
                        if (!rightHandle.current) return;
                        setDragging(null);
                        rightHandle.current!.onpointermove = null;
                        rightHandle.current!.releasePointerCapture(e.pointerId);
                    }}
                />
            </div>
        </div>
    );
}
