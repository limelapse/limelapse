import { Button, buttonVariants } from "@/components/ui/button.tsx";
import SampleInput from "@/components/SampleInput.tsx";
import { useState } from "react";

export function TestSamples() {
    const [count, setCount] = useState(0);
    return (
        <>
            <Button onClick={() => setCount((count) => count + 1)}>
                Click me - {count}
            </Button>
            <Button
                className={buttonVariants({ variant: "outline" })}
                onClick={() => setCount((count) => count + 1)}
            >
                Click me - {count}
            </Button>
            <Button
                className={buttonVariants({ variant: "secondary" })}
                onClick={() => setCount((count) => count + 1)}
            >
                Click me - {count}
            </Button>
            <SampleInput />
        </>
    );
}

export default TestSamples;
