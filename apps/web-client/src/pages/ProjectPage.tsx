import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useApiClient } from "@/lib/api-client.ts";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useS3Api } from "@/lib/s3-client.ts";
import ProjectDetailsPanel from "@/components/project-page/ProjectDetailsPanel.tsx";
import ProjectMediaPanel from "@/components/project-page/ProjectMediaPanel.tsx";
import { useProjects } from "@/context/project-context.tsx";

const ProjectPage: React.FC = () => {
    const { projectId } = useParams();
    const apiClient = useApiClient();
    const s3Api = useS3Api(projectId ?? "");
    const { resetFocusedImage, resetCurrentPageOfSearchResults } =
        useProjects();

    const [loadProjectStatus, setLoadProjectStatus] = useState<
        "loading" | "success" | "failed"
    >("loading");
    const [items, setItems] = useState<
        Array<{ name: string; etag: string; size: number; lastModified: Date }>
    >([]);
    const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);

    useEffect(() => {
        s3Api.listObjects().then((objects) => {
            setItems(
                objects.filter((o) => {
                    return (
                        o.key &&
                        o.key.includes("resolution:original:sharpness:blurred")
                    );
                }),
            );
        });
    }, [projectId]);

    useEffect(() => {
        // Just to show the loading spinner during the cold start
        const loadCurrentProject = async () => {
            setLoadProjectStatus("loading");

            if (!projectId) {
                return;
            }

            try {
                await apiClient.getProject(projectId);
                setLoadProjectStatus("success");
            } catch (error) {
                console.error("fetch current project failed", error);
                setLoadProjectStatus("failed");
            }
        };

        loadCurrentProject();
    }, [projectId]);

    useEffect(() => {
        //each time a project is switched, the currently selected image is reset
        resetFocusedImage();
        resetCurrentPageOfSearchResults();
    }, [projectId]);

    return (
        <div className="p-4 h-full">
            {loadProjectStatus === "loading" && (
                <div className="w-full h-full flex flex-col items-center justify-center">
                    <Loader2 size={48} className="animate-spin" />
                    <div>Loading project ...</div>
                </div>
            )}
            {loadProjectStatus === "failed" && (
                <div className="w-full h-full flex flex-col items-center justify-center">
                    <div className="text-2xl font-bold">
                        Loading project failed :(
                    </div>
                    <div className="mt-2">Please try again later.</div>
                </div>
            )}
            {loadProjectStatus === "success" && (
                <div className="p-4 border-0 border-t-4 border-b-2 [animation:fadeIn_0.5s_ease-out_forwards]">
                    {/*ProjectDetailsPanel renders meta details for the project*/}
                    <ProjectDetailsPanel />

                    {/*ProjectMediaPanel renders selection and preview of images*/}
                    <ProjectMediaPanel />

                    {/*Download:Tab ProjectMediaManager handles upload/download of files and preview of video*/}
                    <div id="ProjectMediaManager">
                        <Button
                            onClick={async () => {
                                setIsGeneratingVideo(true);
                                try {
                                    await apiClient.generateVideo(
                                        projectId!,
                                        items.map((item) => item.name),
                                    );
                                    await new Promise((resolve) =>
                                        setTimeout(resolve, 1000),
                                    );
                                } finally {
                                    setIsGeneratingVideo(false);
                                }
                            }}
                            disabled={isGeneratingVideo || items.length === 0}
                        >
                            {isGeneratingVideo && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Generate Video
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectPage;
