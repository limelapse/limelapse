import { User } from "oidc-client-ts";
import React, { createContext, useContext, ReactNode } from "react";
import { AuthProvider, ErrorContext, useAuth } from "react-oidc-context";

const oidcConfig = {
    authority: `${import.meta.env.VITE_KEYCLOAK_URL}/realms/${import.meta.env.VITE_KEYCLOAK_REALM}`,
    client_id: import.meta.env.VITE_KEYCLOAK_CLIENT,
    redirect_uri: window.location.origin + "/login",
    post_logout_redirect_uri: window.location.origin + "/",
    onSigninCallback: (_user: User | void): void => {
        const redirect =
            localStorage.getItem("keycloak-redirect") ??
            window.location.pathname;
        localStorage.removeItem("keycloak-redirect");

        window.location.assign(redirect);
    },
};

const KeycloakProvider: React.FC<{ children: ReactNode }> = ({ children }) => (
    <AuthProvider {...oidcConfig}>
        <KeycloakContextProvider>{children}</KeycloakContextProvider>
    </AuthProvider>
);

export default KeycloakProvider;

export function useKeycloak(): KeycloakContextType {
    const context = useContext(KeycloakContext);
    if (!context) {
        throw new Error("useKeycloak must be used within an KeycloakProvider");
    }
    return context;
}

export type KeycloakContextType = {
    signInWithRedirect: (path: string) => void;
    signOut: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: ErrorContext | undefined;
    user: User | null | undefined;
};

const KeycloakContext = createContext<KeycloakContextType | null>(null);

const KeycloakContextProvider: React.FC<{ children: ReactNode }> = ({
    children,
}) => {
    const auth = useAuth();

    const signInWithRedirect = (path: string) => {
        localStorage.setItem("keycloak-redirect", path);
        auth.signinRedirect();
    };

    const logout = () => {
        auth.signoutRedirect();
    };

    return (
        <KeycloakContext.Provider
            value={{
                signInWithRedirect,
                signOut: logout,
                isAuthenticated: auth.isAuthenticated,
                isLoading: auth.isLoading,
                error: auth.error,
                user: auth.user,
            }}
        >
            {children}
        </KeycloakContext.Provider>
    );
};
