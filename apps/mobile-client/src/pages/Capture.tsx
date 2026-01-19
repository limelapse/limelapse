import {
    IonBackButton,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonPage,
    IonPopover,
    IonSpinner,
    IonText,
    IonTitle,
    IonToolbar,
    useIonRouter,
} from "@ionic/react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CameraPreview } from "@capacitor-community/camera-preview";
import ProjectsService, { Project } from "../services/ProjectsService";
import AuthService from "../services/AuthService";
import { settingsOutline } from "ionicons/icons";
import { Device } from "@capacitor/device";
import TelemetryService from "../services/TelemetryService";
import PictureService from "../services/PictureService";

const Capture: React.FC = () => {
    const router = useIonRouter();

    const { id } = useParams<{ id: string }>();
    const [project, setProject] = useState<Project | null | undefined>(
        undefined,
    );
    const [photo, setPhoto] = useState<string | null>(null);
    const [message, setMessage] = useState<{
        msg: string;
        color:
            | "primary"
            | "secondary"
            | "tertiary"
            | "success"
            | "warning"
            | "danger"
            | "light"
            | "medium"
            | "dark";
    } | null>(null);

    const [intervalTime, setIntervalTime] = useState<number>(30_000); // Default: 30s
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => {
        let interval: NodeJS.Timeout;

        const fetchProject = async () => {
            try {
                const bearer = await AuthService.getAccessToken(router);
                const project = await ProjectsService.getProjectById(
                    bearer,
                    id,
                );
                console.log("Fetched project:", project);
                setProject(project);
            } catch (error) {
                console.error("Failed to fetch projects:", error);
                setProject(null);
            }
        };

        const startPreview = async () => {
            await CameraPreview.start({
                position: "rear",
                parent: "camera-content",
                disableAudio: true,
                toBack: true,
            });
        };

        const takePicture = async (): Promise<string | undefined> => {
            try {
                const result = await CameraPreview.capture({
                    quality: 85,
                });

                if (!result.value) {
                    console.log("No picture captured");
                    setMessage({
                        msg: "Reading image from camera failed.",
                        color: "danger",
                    });
                    return;
                }

                // Display image
                setPhoto(`data:image/jpeg;base64,${result.value}`);

                return result.value;
            } catch (err) {
                console.error("Capture error:", err);
                setMessage({
                    msg: "Capturing image failed.",
                    color: "danger",
                });
            }
        };

        const init = async () => {
            if (showSettings) {
                return;
            }
            if (project === undefined) {
                await fetchProject();
            }
            if (!project) {
                // Do nothing if project fetch failed
                return;
            }

            try {
                await startPreview();

                const recurrentTask = async () => {
                    const now = new Date();
                    if (project.captureStart) {
                        const [hours, minutes] = parseTime(
                            project.captureStart,
                        );

                        if (
                            now.getHours() < hours ||
                            (now.getHours() == hours &&
                                now.getMinutes() < minutes)
                        ) {
                            console.log("Before captureStart");
                            setMessage({
                                msg: `Capture starts at ${hours}:${minutes}`,
                                color: "primary",
                            });
                            return;
                        }
                    }
                    if (project.captureEnd) {
                        const [hours, minutes] = parseTime(project.captureEnd);

                        if (
                            now.getHours() > hours ||
                            (now.getHours() == hours &&
                                now.getMinutes() > minutes)
                        ) {
                            console.log("After captureEnd");
                            setMessage({
                                msg: `Capture ended at ${hours}:${minutes}`,
                                color: "primary",
                            });
                            return;
                        }
                    }

                    const picture = await takePicture();
                    if (!picture) {
                        console.log("No picture returned");
                        return;
                    }

                    let bearer: string;
                    try {
                        bearer = await AuthService.getAccessToken(router);
                    } catch (error) {
                        console.error("Authentication failed:", error);
                        setMessage({
                            msg: "Authentication failed.",
                            color: "danger",
                        });
                        return;
                    }

                    try {
                        const startTime = performance.now();

                        await PictureService.uploadPicture(bearer, id, picture);

                        const endTime = performance.now();
                        const uploadDuration = endTime - startTime;
                        console.log("Upload took: ", uploadDuration);

                        try {
                            const deviceInfo = await Device.getInfo();
                            const batteryInfo = await Device.getBatteryInfo();

                            await TelemetryService.uploadTelemetry(bearer, id, {
                                name: deviceInfo.name,
                                model: deviceInfo.model,
                                isCharging: batteryInfo.isCharging,
                                batteryLevel: batteryInfo.batteryLevel
                                    ? Math.round(batteryInfo.batteryLevel * 100)
                                    : undefined,
                                memUsed: deviceInfo.memUsed
                                    ? Math.round(deviceInfo.memUsed / 1048576)
                                    : undefined,
                                uploadDuration: Math.round(uploadDuration),
                            });

                            setMessage(null);
                        } catch (error) {
                            console.error(
                                "Uploading device telemetry failed:",
                                error,
                            );
                            setMessage({
                                msg: "Uploading device telemetry to server failed.",
                                color: "danger",
                            });
                        }
                    } catch (error) {
                        console.error("Uploading image failed:", error);
                        setMessage({
                            msg: "Uploading image to server failed.",
                            color: "danger",
                        });
                    }
                };

                recurrentTask();

                interval = setInterval(recurrentTask, intervalTime);
            } catch (error) {
                console.error("Camera Preview error:", error);
                setMessage({
                    msg: "Accessing camera failed. Check permissions and try again.",
                    color: "danger",
                });
            }
        };

        init();

        return () => {
            try {
                if (project) {
                    CameraPreview.stop();
                    clearInterval(interval);
                }
            } catch (err) {}
            setPhoto(null);
            setMessage(null);
        };
    }, [showSettings, project]);

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonBackButton defaultHref="/projects" text="Back" />
                    </IonButtons>
                    <IonTitle>Capture</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={() => setShowSettings(true)}>
                            <IonIcon icon={settingsOutline} />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen scrollY={false} className="ion-padding">
                <IonPopover
                    isOpen={showSettings}
                    onDidDismiss={() => setShowSettings(false)}
                >
                    <div
                        style={{
                            margin: "20px 0 0 0",
                        }}
                    >
                        <IonText
                            style={{
                                fontSize: "20px",
                                fontWeight: "bold",
                                padding: "1rem",
                            }}
                        >
                            Settings
                        </IonText>
                        <IonItem>
                            <IonLabel position="stacked">
                                Intervall (ms)
                            </IonLabel>
                            <IonInput
                                type="number"
                                value={intervalTime}
                                onIonChange={(e) =>
                                    setIntervalTime(Number(e.detail.value))
                                }
                            />
                        </IonItem>
                    </div>
                </IonPopover>

                {project === undefined && (
                    <div className="center-message">
                        <IonSpinner name="crescent" />
                        <IonText>Fetching project...</IonText>
                    </div>
                )}

                {project === null && (
                    <div className="center-message">
                        <IonText color="danger">
                            <h3>Fetching project failed!</h3>
                        </IonText>
                        <IonText>Please try again later.</IonText>
                    </div>
                )}

                {project && (
                    <div className="project-info">
                        <IonText>
                            <h2 className="project-title">{project.name}</h2>
                        </IonText>

                        <IonText color="medium">
                            <p className="project-dates">
                                {project.start.toLocaleDateString()} –{" "}
                                {project.end.toLocaleDateString()}
                            </p>
                        </IonText>

                        <IonText>
                            <p className="project-description">
                                {project.description}
                            </p>
                        </IonText>
                    </div>
                )}

                {message && (
                    <div className="center-message">
                        <IonText color={message.color}>
                            <h3>{message.msg}</h3>
                        </IonText>
                    </div>
                )}

                {!message && photo && (
                    <div
                        style={{
                            marginTop: 20,
                            display: "flex",
                            justifyContent: "center",
                        }}
                    >
                        <img
                            src={photo}
                            alt="Captured"
                            style={{
                                height: "65vh",
                                borderRadius: "10px",
                            }}
                        />
                    </div>
                )}
            </IonContent>
        </IonPage>
    );
};

export default Capture;

function parseTime(time: string): number[] {
    const parts = time.split(":");

    return [Number(parts[0]), Number(parts[1])];
}
