import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible.tsx";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
    ChevronUp,
    CircleDashed,
    CirclePlay,
    Loader2,
    Trash2,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useApiClient, Video } from "@/lib/api-client.ts";
import { useParams } from "react-router-dom";

const DownloadCenter: React.FC = () => {
    const { projectId } = useParams();
    const apiClient = useApiClient();

    const [videos, setVideos] = useState<Video[]>([]);
    const [openVideoCollapsibleId, setOpenVideoCollapsibleId] = useState<
        string | null
    >(null);
    const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
    const [openDeleteVideoDialogId, setOpenDeleteVideoDialogId] = useState<
        string | null
    >(null);
    const [loadVideoStatus, setLoadVideoStatus] = useState<"idle" | "loading">(
        "loading",
    );

    useEffect(() => {
        if (projectId) {
            setLoadVideoStatus("loading");
            fetchVideos()
                .then((videos) => {
                    setVideos(videos);
                    setLoadVideoStatus("idle");
                })
                .catch((error) => {
                    console.error("Failed to fetch videos:", error);
                    setLoadVideoStatus("idle");
                });
        }
    }, [projectId]);

    const deleteVideo = async (videoId: string) => {
        try {
            if (!projectId) {
                throw new Error("projectIdOfSelectedProject is undefined");
            }
            await apiClient.deleteVideo(projectId, videoId);
        } catch (e) {
            console.error(`Failed to delete video with ID ${videoId}.`, e);
        }
    };

    const fetchVideos = async (): Promise<Video[]> => {
        if (projectId) {
            return apiClient
                .listVideos(projectId)
                .then((videos) => videos as unknown as Video[]);
        } else {
            throw new Error("projectId is undefined");
        }
    };

    const renderLoadingSpinner = () => (
        <div className="w-full h-full flex flex-col justify-center items-center">
            <Loader2 size={48} className="animate-spin" />
            <div>Loading your videos</div>
        </div>
    );

    const renderDownloadCenterWithVideos = () => (
        <div id="DownloadCenter">
            <div className="flex text-xl mb-1">
                <div>Your videos:</div>
                <div className="font-bold ml-1">
                    {videos.length != 0 ? (
                        <span>{videos.length}</span>
                    ) : (
                        "You haven't generated any videos yet"
                    )}
                </div>
            </div>
            <div className="space-y-2 max-h-[80vh] overflow-y-auto">
                {videos.length != 0 ? (
                    videos
                        .sort(
                            (a, b) =>
                                (b.createdAt
                                    ? new Date(b.createdAt).getTime()
                                    : new Date().getTime()) -
                                (a.createdAt
                                    ? new Date(a.createdAt).getTime()
                                    : new Date().getTime()),
                        )
                        .map((video) => (
                            <div
                                className={`p-2 border rounded flex-col justify-between items-center
                                                                ${video.status === "FINISHED" ? "hover:bg-gray-50" : "text-gray-700"}
                                                                `}
                            >
                                {video.status === "FINISHED" && (
                                    <Collapsible
                                        key={video.id}
                                        open={
                                            openVideoCollapsibleId === video.id
                                        }
                                        onOpenChange={async (open) => {
                                            setOpenVideoCollapsibleId(
                                                open ? video.id : null,
                                            );
                                            if (
                                                open &&
                                                video.status === "FINISHED"
                                            ) {
                                                const url =
                                                    await apiClient.getVideo(
                                                        projectId!,
                                                        video.id,
                                                    );
                                                setCurrentVideoUrl(url);
                                            } else {
                                                setCurrentVideoUrl(null);
                                            }
                                        }}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div className="text-sm cursor-text">
                                                {`Video created at ${new Date(
                                                    video.createdAt,
                                                ).toLocaleString()}`}
                                            </div>
                                            <div className="text-sm flex justify-between items-center gap-2">
                                                <CollapsibleTrigger asChild>
                                                    <Button variant="ghost">
                                                        {openVideoCollapsibleId ===
                                                        video.id ? (
                                                            <ChevronUp />
                                                        ) : (
                                                            <CirclePlay />
                                                        )}
                                                    </Button>
                                                </CollapsibleTrigger>
                                                <Dialog
                                                    open={
                                                        openDeleteVideoDialogId ===
                                                        video.id
                                                    }
                                                    onOpenChange={(open) =>
                                                        setOpenDeleteVideoDialogId(
                                                            open
                                                                ? video.id
                                                                : null,
                                                        )
                                                    }
                                                >
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            className="text-red-500 hover:text-red-700"
                                                            variant="ghost"
                                                            size="icon"
                                                        >
                                                            <Trash2 />
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-[425px] md:max-w-[500px]">
                                                        <DialogHeader>
                                                            <DialogTitle>
                                                                Do you want to
                                                                delete this
                                                                video?
                                                            </DialogTitle>
                                                        </DialogHeader>
                                                        <DialogDescription>
                                                            This action cannot
                                                            be undone. Once you
                                                            delete the project,
                                                            it cannot be
                                                            restored and your
                                                            images are deleted.
                                                        </DialogDescription>
                                                        <DialogFooter className="justify-end">
                                                            <Button
                                                                className="bg-red-500 hover:bg-red-600"
                                                                onClick={async () => {
                                                                    await deleteVideo(
                                                                        video.id,
                                                                    );
                                                                    setOpenDeleteVideoDialogId(
                                                                        null,
                                                                    );
                                                                    fetchVideos().then(
                                                                        (
                                                                            videos,
                                                                        ) =>
                                                                            setVideos(
                                                                                videos,
                                                                            ),
                                                                    );
                                                                }}
                                                                disabled={
                                                                    video.status !==
                                                                    "FINISHED"
                                                                }
                                                            >
                                                                Yes, delete this
                                                                video
                                                            </Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                        </div>
                                        <CollapsibleContent>
                                            <div
                                                className="mt-4"
                                                ref={(el) => {
                                                    if (
                                                        el &&
                                                        openVideoCollapsibleId ===
                                                            video.id
                                                    ) {
                                                        setTimeout(() => {
                                                            el.scrollIntoView({
                                                                behavior:
                                                                    "smooth",
                                                                block: "center",
                                                            });
                                                        }, 100);
                                                    }
                                                }}
                                            >
                                                {openVideoCollapsibleId ===
                                                    video.id &&
                                                    (currentVideoUrl ? (
                                                        <iframe
                                                            className="w-full aspect-video rounded"
                                                            src={
                                                                currentVideoUrl
                                                            }
                                                            title="Video player"
                                                            allowFullScreen
                                                        />
                                                    ) : (
                                                        <div className="flex justify-center items-center aspect-video">
                                                            <Loader2 className="h-8 w-8 animate-spin" />
                                                        </div>
                                                    ))}
                                            </div>
                                        </CollapsibleContent>
                                    </Collapsible>
                                )}
                                {video.status === "PROCESSING" && (
                                    <div className="flex justify-between items-center">
                                        <div className="text-sm">
                                            Video is being processed
                                        </div>
                                        <div className="text-sm flex justify-between items-center gap-1">
                                            <Loader2 className="ml-2 animate-spin text-gray-700" />
                                        </div>
                                    </div>
                                )}
                                {video.status === "QUEUED" && (
                                    <div className="flex justify-between items-center">
                                        <div className="text-sm">
                                            Video is queued for processing
                                        </div>
                                        <div className="text-sm flex justify-between items-center gap-1">
                                            <CircleDashed className="ml-2 text-gray-700" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                ) : (
                    <span className="text-gray-700 text-sm">
                        No videos available.
                    </span>
                )}
            </div>
        </div>
    );

    return (
        <div>
            {loadVideoStatus === "loading"
                ? renderLoadingSpinner()
                : renderDownloadCenterWithVideos()}
        </div>
    );
};

export default DownloadCenter;
