import {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonCardSubtitle,
    IonRefresher,
    IonRefresherContent,
    useIonRouter,
    useIonViewWillEnter,
    IonSpinner,
    IonText,
} from "@ionic/react";
import { logOutOutline } from "ionicons/icons";
import React, { useState } from "react";
import "./Projects.css";
import AuthService from "../services/AuthService";
import ProjectsService, { Project } from "../services/ProjectsService";

const Projects: React.FC = () => {
    const router = useIonRouter();
    // undefined: still loading
    // null: error while fetching
    const [projects, setProjects] = useState<Project[] | null | undefined>(
        undefined,
    );

    const handleLogout = () => {
        AuthService.logout();
        router.push("/welcome");
    };

    const fetchProjects = async () => {
        try {
            const bearer = await AuthService.getAccessToken(router);
            const projects = await ProjectsService.getProjects(bearer);
            console.log("Fetched projects:", projects);
            setProjects(projects);
        } catch (error) {
            console.error("Failed to fetch projects:", error);
            setProjects(null);
        }
    };

    const handleRefresh = async (event: CustomEvent) => {
        await fetchProjects();
        event.detail.complete();
    };

    useIonViewWillEnter(() => {
        setProjects(undefined);
        fetchProjects();
    }, []);

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Projects</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={handleLogout}>
                            <IonIcon slot="icon-only" icon={logOutOutline} />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                <IonHeader collapse="condense">
                    <IonToolbar>
                        <IonTitle size="large">Projects</IonTitle>
                    </IonToolbar>
                </IonHeader>
                <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
                    <IonRefresherContent
                        pullingText="Pull to refresh"
                        refreshingSpinner="circles"
                    />
                </IonRefresher>

                {projects === undefined && (
                    <div className="center-message">
                        <IonSpinner name="crescent" />
                        <IonText>Fetching projects...</IonText>
                    </div>
                )}

                {projects === null && (
                    <div className="center-message">
                        <IonText color="danger">
                            <h3>Fetching projects failed!</h3>
                        </IonText>
                        <IonText>
                            Please pull to refresh or try again later.
                        </IonText>
                    </div>
                )}

                {projects && projects.length === 0 && (
                    <div className="center-message">
                        <IonText color="medium">
                            <h3>No projects yet</h3>
                        </IonText>
                        <IonText>Start by creating your first project.</IonText>
                    </div>
                )}

                {projects &&
                    projects.length > 0 &&
                    projects.map((project) => (
                        <IonCard
                            key={project.id}
                            button
                            onClick={() =>
                                router.push(`/capture/${project.id}`)
                            }
                        >
                            <IonCardHeader>
                                <IonCardTitle>{project.name}</IonCardTitle>
                                <IonCardSubtitle>
                                    {project.start.toLocaleDateString()} -{" "}
                                    {project.end.toLocaleDateString()}
                                </IonCardSubtitle>
                                <IonCardSubtitle>
                                    {project.description}
                                </IonCardSubtitle>
                            </IonCardHeader>
                        </IonCard>
                    ))}

                <IonInfiniteScroll
                    onIonInfinite={(event) => event.target.complete()}
                    threshold="100px"
                    disabled={false}
                >
                    <IonInfiniteScrollContent loadingText="Loading more projects..." />
                </IonInfiniteScroll>
            </IonContent>
        </IonPage>
    );
};

export default Projects;
