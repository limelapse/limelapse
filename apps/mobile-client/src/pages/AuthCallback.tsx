import { IonContent, IonPage, useIonRouter } from "@ionic/react";
import "./Welcome.css";
import AuthService from "../services/AuthService";
import { useEffect } from "react";

const AuthCallback: React.FC = () => {
    const router = useIonRouter();

    useEffect(() => {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        if (!code) {
            console.error("No code in URL");
            return;
        }

        const handleAuth = async () => {
            try {
                await AuthService.initAuthToken(code);
                router.push("/projects");
            } catch (err) {
                console.error("Auth callback error:", err);
            }
        };

        handleAuth();
    }, []);

    return (
        <IonPage className="welcome-page">
            <IonContent fullscreen scrollY={false} className="ion-padding">
                Login in...
            </IonContent>
        </IonPage>
    );
};

export default AuthCallback;
