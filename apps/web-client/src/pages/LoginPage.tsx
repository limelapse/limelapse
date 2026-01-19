import { Loader2 } from "lucide-react";
import React from "react";

const LoginPage: React.FC = () => {
    return (
        <div className="w-full h-full flex flex-col justify-center items-center">
            <Loader2 size={48} className="animate-spin" />
            <div>Signing you in...</div>
        </div>
    );
};

export default LoginPage;
