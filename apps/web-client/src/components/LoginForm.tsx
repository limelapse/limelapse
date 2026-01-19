import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button.tsx";

export function LoginForm() {
    return (
        //TODO Form can be enhanced by using this: https://ui.shadcn.com/docs/components/form
        <div className="grid w-full max-w-sm mx-auto items-center gap-3.5">
            <div>
                <Label htmlFor="email">Email</Label>
                <Input
                    className="mt-0.5"
                    type="email"
                    id="email"
                    placeholder="Your Email"
                />
            </div>

            <div>
                <Label htmlFor="password">Password</Label>
                <Input
                    className="mt-1"
                    type="password"
                    id="password"
                    placeholder="Your Password"
                />
            </div>

            <Button onClick={() => console.log("Clicked")}>Log in</Button>
        </div>
    );
}

export default LoginForm;
