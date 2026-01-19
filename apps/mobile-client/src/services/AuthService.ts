import { UseIonRouterResult } from "@ionic/react";
import { SecureStoragePlugin } from "capacitor-secure-storage-plugin";
import { sha256 } from "js-sha256";
import { v4 as uuidv4 } from "uuid";

export default class AuthService {
    public static async createAuthUrl(): Promise<string> {
        const codeChallenge = await AuthService.generateCodeChallenge();

        return (
            `${import.meta.env.VITE_KEYCLOAK_URL}/realms/${import.meta.env.VITE_KEYCLOAK_REALM}/protocol/openid-connect/auth` +
            `?client_id=${encodeURIComponent(import.meta.env.VITE_KEYCLOAK_CLIENT)}` +
            `&redirect_uri=${encodeURIComponent(import.meta.env.VITE_KEYCLOAK_REDIRECT_URI)}` +
            `&response_type=code` +
            `&scope=${encodeURIComponent("openid")}` +
            `&code_challenge=${encodeURIComponent(codeChallenge)}` +
            `&code_challenge_method=S256` +
            `&state=${encodeURIComponent(uuidv4())}`
        );
    }

    public static async initAuthToken(authorization_code: string) {
        const codeVerifier = await AuthService.getCodeVerifier();

        const response = await fetch(
            `${import.meta.env.VITE_KEYCLOAK_URL}/realms/${import.meta.env.VITE_KEYCLOAK_REALM}/protocol/openid-connect/token`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                    grant_type: "authorization_code",
                    code: authorization_code,
                    redirect_uri: import.meta.env.VITE_KEYCLOAK_REDIRECT_URI,
                    client_id: import.meta.env.VITE_KEYCLOAK_CLIENT,
                    code_verifier: codeVerifier,
                }),
            },
        );

        if (response.status !== 200) {
            throw `Authentication failed, server status: ${response.statusText}`;
        }

        const authResponse = await response.json();

        await AuthService.saveAuthResponse(authResponse);
    }

    public static async getAccessToken(router: UseIonRouterResult) {
        let authResponse: AuthResponse = JSON.parse(
            (
                await SecureStoragePlugin.get({
                    key: "Auth-Response",
                })
            ).value,
        );

        if (new Date(authResponse.expires_at) <= new Date()) {
            if (new Date(authResponse.refresh_expires_at) <= new Date()) {
                AuthService.logout();
                router.push("/welcome");
            } else {
                authResponse = await AuthService.refreshToken(
                    authResponse.refresh_token,
                );
            }
        }

        return authResponse.access_token;
    }

    public static async logout() {
        try {
            await SecureStoragePlugin.remove({
                key: "Auth-Response",
            });
        } catch (_) {}
    }

    private static async refreshToken(
        refreshToken: string,
    ): Promise<AuthResponse> {
        const response = await fetch(
            `${import.meta.env.VITE_KEYCLOAK_URL}/realms/${import.meta.env.VITE_KEYCLOAK_REALM}/protocol/openid-connect/token`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                    grant_type: "refresh_token",
                    refresh_token: refreshToken,
                    client_id: import.meta.env.VITE_KEYCLOAK_CLIENT,
                }),
            },
        );

        if (response.status !== 200) {
            throw `Refreshing access token failed, server status: ${response.statusText}`;
        }

        const authResponse = await response.json();

        return await AuthService.saveAuthResponse(authResponse);
    }

    private static async generateCodeVerifier(length = 128): Promise<string> {
        const charset =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

        let codeVerifier = "";
        for (let i = 0; i < length; i++) {
            codeVerifier += charset.charAt(
                Math.floor(Math.random() * charset.length),
            );
        }

        await SecureStoragePlugin.set({
            key: "PKCE-Verifier",
            value: codeVerifier,
        });

        return codeVerifier;
    }

    private static async getCodeVerifier(): Promise<string> {
        const codeVerifier = (
            await SecureStoragePlugin.get({
                key: "PKCE-Verifier",
            })
        ).value;

        await SecureStoragePlugin.remove({
            key: "PKCE-Verifier",
        });

        return codeVerifier;
    }

    private static async generateCodeChallenge(): Promise<string> {
        const codeVerifier = await AuthService.generateCodeVerifier();
        const hash = sha256.array(codeVerifier);

        return AuthService.base64UrlEncode(new Uint8Array(hash));
    }

    private static async saveAuthResponse(authResponse: any) {
        const expires_at = new Date();
        expires_at.setSeconds(
            expires_at.getSeconds() + authResponse.expires_in,
        );
        authResponse.expires_at = expires_at;

        const refresh_expires_at = new Date();
        refresh_expires_at.setSeconds(
            refresh_expires_at.getSeconds() + authResponse.refresh_expires_in,
        );
        authResponse.refresh_expires_at = refresh_expires_at;

        await SecureStoragePlugin.set({
            key: "Auth-Response",
            value: JSON.stringify(authResponse),
        });

        return authResponse;
    }

    private static base64UrlEncode(buffer: Uint8Array) {
        return btoa(String.fromCharCode(...buffer))
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, "");
    }
}

interface AuthResponse {
    access_token: string;
    expires_in: number;
    expires_at: Date;

    refresh_token: string;
    refresh_expires_in: number;
    refresh_expires_at: Date;
}

export class NotAuthenticatedError extends Error {}
