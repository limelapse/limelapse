import {
    IonButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonContent,
    IonPage,
    IonText,
    IonIcon,
    IonImg,
    useIonRouter,
    useIonToast,
} from "@ionic/react";
import { arrowForward } from "ionicons/icons";
import "./Welcome.css";
import { Browser } from "@capacitor/browser";
import { App as CApp } from "@capacitor/app";
import AuthService from "../services/AuthService";
import { Device } from "@capacitor/device";

const Welcome: React.FC = () => {
    const [present] = useIonToast();
    const router = useIonRouter();

    function showToast(message: string) {
        present({
            message,
            duration: 5000,
            position: "bottom",
            color: "danger",
        });
    }

    CApp.addListener("appUrlOpen", async (event) => {
        const url = event.url;
        if (url.startsWith(import.meta.env.VITE_KEYCLOAK_REDIRECT_URI)) {
            const code = new URL(url).searchParams.get("code");

            await Browser.close();

            if (code === null) {
                console.error("Received no code from keycloak");
                showToast("Authentication failed!");
                return;
            }

            try {
                await AuthService.initAuthToken(code);
                router.push("/projects");
            } catch (err) {
                console.error("Token exchange failed", err);
                showToast("Authentication failed!");
            }
        }
    });

    const handleLogin = async (e?: React.FormEvent) => {
        e?.preventDefault();

        try {
            const authUrl = await AuthService.createAuthUrl();

            const info = await Device.getInfo();
            if (info.platform === "web") {
                window.location.href = authUrl;
            } else {
                await Browser.open({
                    url: authUrl,
                });
            }
        } catch (err) {
            console.error("Error while redirecting to keycloak", err);
            showToast("Redirecting to authentication provider failed!");
            return;
        }
    };

    return (
        <IonPage className="welcome-page">
            <IonContent fullscreen scrollY={false} className="ion-padding">
                {/* App Logo */}
                <div className="logo-container ion-padding-top">
                    <IonImg
                        src="/logo.png"
                        alt="LimeLapse"
                        className="app-logo"
                    />
                    <h1 className="app-name">LimeLapse</h1>
                    <IonText color="medium">
                        <p className="app-tagline">
                            Squeeze time, flavor your journey
                        </p>
                    </IonText>
                </div>

                {/* Login Form */}
                <IonCard className="auth-card">
                    <IonCardHeader>
                        <IonCardTitle className="ion-text-center">
                            Welcome
                        </IonCardTitle>
                    </IonCardHeader>

                    <IonCardContent>
                        <form onSubmit={handleLogin}>
                            <IonButton
                                className="login-button"
                                type="submit"
                                expand="block"
                                shape="round"
                                strong={true}
                            >
                                Start Now
                                <IonIcon
                                    slot="end"
                                    icon={arrowForward}
                                ></IonIcon>
                            </IonButton>
                        </form>
                    </IonCardContent>
                </IonCard>
            </IonContent>
        </IonPage>
    );
};

export default Welcome;
