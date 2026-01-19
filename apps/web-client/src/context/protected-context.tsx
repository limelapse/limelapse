import React, { createContext, useContext, useEffect } from "react";
import { useKeycloak } from "./keycloak-context";
import { User } from "oidc-client-ts";
import { Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";

type ProtectedContextType = {
    user: User;
    signOut: () => void;
};

const ProtectedContext = createContext<ProtectedContextType | null>(null);

const ProtectedProvider: React.FC = () => {
    const keycloak = useKeycloak();

    useEffect(() => {
        if (!keycloak.isAuthenticated && !keycloak.isLoading) {
            keycloak.signInWithRedirect(window.location.pathname);
        }
    }, [keycloak.isAuthenticated, keycloak.isLoading]);

    if (!keycloak.isAuthenticated) {
        return (
            <div className="w-full h-full flex flex-col justify-center items-center">
                <Loader2 size={48} className="animate-spin" />
                <div>Logging out, goodbye!</div>
            </div>
        );
    }

    return (
        <ProtectedContext.Provider
            value={{
                user: keycloak.user!,
                signOut: keycloak.signOut,
            }}
        >
            <Outlet />
        </ProtectedContext.Provider>
    );
};

export function useProtected(): ProtectedContextType {
    const context = useContext(ProtectedContext);
    if (!context) {
        throw new Error(
            "useProtected must be used within an ProtectedProvider",
        );
    }
    return context;
}

export default ProtectedProvider;
