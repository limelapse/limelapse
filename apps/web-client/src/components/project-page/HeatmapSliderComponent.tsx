import { useEffect, useRef, useState } from "react";
import { DateTimePicker } from "@/components/ui/datetimepicker.tsx";
import DualSlider from "@/components/project-page/DualSlider.tsx";

type HeatmapSliderProps = {
    values: (number | null)[];
    start: Date;
    end: Date;
    onRangeChange?: (from: Date, to: Date) => void;
};

export default function HeatmapSlider({
    values,
    start,
    end,
    onRangeChange,
}: HeatmapSliderProps) {
    const [startDate, setStartDate] = useState(start);
    const [endDate, setEndDate] = useState(end);
    const initialStart = useRef(start);
    const initialEnd = useRef(end);
    const totalDuration = useRef(end.getTime() - start.getTime());
    const [range, setRange] = useState<[number, number]>([0, 1]);

    const handleSliderChange = (left: number, right: number) => {
        const s = new Date(start.getTime() + left * totalDuration.current);
        setStartDate(s);
        const e = new Date(start.getTime() + right * totalDuration.current);
        setEndDate(e);
        onRangeChange?.(s, e);
    };

    const handleDateChange = (s: Date, e: Date) => {
        setStartDate(s);
        setEndDate(e);
        onRangeChange?.(s, e);
        setRange([
            (s.getTime() - start.getTime()) / totalDuration.current,
            (e.getTime() - start.getTime()) / totalDuration.current,
        ]);
    };

    useEffect(() => {
        if (
            initialStart.current.getTime() != start.getTime() ||
            initialEnd.current.getTime() != end.getTime()
        ) {
            totalDuration.current = end.getTime() - start.getTime();
            setStartDate(start);
            initialStart.current = start;
            setEndDate(end);
            initialEnd.current = end;
        }
    }, [start, end]);

    const gradient = `linear-gradient(to right, ${values
        .map((v, i) => {
            const intensity = v == null ? 0 : Math.max(0, Math.min(1, v));
            const hue = 90;
            const lightness = 100 - intensity * 60;
            return `hsl(${hue}, 100%, ${lightness}%) ${((i / values.length) * 100).toFixed(2)}%`;
        })
        .join(", ")})`;

    return (
        <div className="relative w-full p-4 border rounded-2xl shadow bg-white">
            <div
                className={`border rounded mb-4`}
                style={{ backgroundImage: gradient }}
            >
                <DualSlider
                    start={range[0]}
                    end={range[1]}
                    onRangeChange={handleSliderChange}
                />
            </div>
            <div></div>
            <div className="relative z-10 flex flex-col items-center space-y-3">
                <div className="flex flex-wrap items-center justify-between w-full gap-4">
                    <div className="w-48">
                        <DateTimePicker
                            displayFormat={{
                                hour12: "dd.MM.yyyy hh:mm",
                                hour24: "dd.MM.yyyy HH:mm",
                            }}
                            value={startDate}
                            defaultPopupValue={startDate}
                            onChange={(date) => {
                                if (
                                    date &&
                                    date.getTime() <= endDate.getTime() &&
                                    date.getTime() >=
                                        initialStart.current.getTime()
                                ) {
                                    handleDateChange(date, endDate);
                                }
                            }}
                            granularity="minute"
                            className="text-gray-700"
                        />
                    </div>
                    <div className="w-48">
                        <DateTimePicker
                            displayFormat={{
                                hour12: "dd.MM.yyyy hh:mm",
                                hour24: "dd.MM.yyyy HH:mm",
                            }}
                            value={endDate}
                            onChange={(date) => {
                                if (
                                    date &&
                                    date.getTime() >= startDate.getTime() &&
                                    date.getTime() <=
                                        initialEnd.current.getTime()
                                ) {
                                    handleDateChange(startDate, date);
                                }
                            }}
                            granularity="minute"
                            className="text-gray-700"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
