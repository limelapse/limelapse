import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useRef } from "react";
import { adjectives, adverbs, nouns, verbs } from "human-id/index.ts";
import seedrandom from "seedrandom";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function useDebounce(
    cb: (...args: any[]) => void,
    delay: number,
): (...args: any[]) => void {
    const timeoutId = useRef<ReturnType<typeof setTimeout> | undefined>(
        undefined,
    );

    return function (...args: any[]) {
        if (timeoutId.current) {
            clearTimeout(timeoutId.current);
        }

        timeoutId.current = setTimeout(() => cb(...args), delay);
    };
}

// Parse a YYYY-MM-DD string and return a Date object
export function parseDate(dateString: string): Date {
    return new Date(dateString);
}

export function parseTime(time: string | null): string | null {
    if (!time) {
        return null;
    }

    const [hours, minutes] = time.split(":");

    return `${hours}:${minutes}`;
}

// Format Date object to YYYY-MM-DD for the date input
export function formatDate(date: Date): string {
    return date.toISOString().split("T")[0];
}

function random(arr: string[], randomness: number): string {
    return arr[Math.floor(randomness * arr.length)];
}
export function uuidToName(uuid: string): string {
    const prg = seedrandom(uuid);
    let res = [
        ...[...Array(1)].map((_) => random(adjectives, prg.quick())),
        random(nouns, prg.quick()),
        random(verbs, prg.quick()),
        ...[random(adverbs, prg.quick())],
    ];
    res = res.map((r) => r.charAt(0).toUpperCase() + r.substr(1));

    return res.join(" ");
}

export function extractTimestampFromUUIDv7(string: string) {
    const msb = string.substring(0, 8 + 1 + 4); // first 12 characters in uuid (+ the dash), i.e 48 bit timestamp part
    return parseInt(msb.replace("-", ""), 16);
}
