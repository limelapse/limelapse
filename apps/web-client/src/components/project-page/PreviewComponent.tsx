import { useApiClient } from "@/lib/api-client.ts";
import { useS3Api } from "@/lib/s3-client.ts";
import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import { AlertCircleIcon, Loader2, RefreshCcw } from "lucide-react";
import DualSlider from "@/components/project-page/DualSlider.tsx";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.tsx";
import { extractTimestampFromUUIDv7 } from "@/lib/utils.ts";

interface PreviewProps {
    projectId: string;
    ref: React.RefObject<string | null>;
}

export const PreviewComponent: React.FC<PreviewProps> = React.memo(
    ({ projectId, ref }) => {
        const apiClient = useApiClient();
        const s3Api = useS3Api(projectId ?? "");

        const [items, setItems] = useState<
            Array<{
                name: string;
                etag: string;
                size: number;
                lastModified: Date;
            }>
        >([]);
        const [videoUrl, setVideoUrl] = useState<string | null>(ref.current);
        const [showAlert, setShowAlert] = useState(false);

        const [left, setLeft] = useState(0);
        const [right, setRight] = useState(1);

        const [start, setStart] = useState(new Date());
        const [end, setEnd] = useState(new Date());

        const fetchPreview = useCallback(async () => {
            if (!items.length) return;
            const leftDate = getLeftDate();
            const rightDate = getRightDate();
            const selectedItems = items
                .map((p) => p.name)
                .filter(
                    (imageId) =>
                        "true" ===
                        localStorage.getItem(
                            `selected-${projectId}-${imageId.split(":")[2]}`,
                        ),
                )
                .filter((imageId) =>
                    ((timestamp: number) =>
                        timestamp >= leftDate.getTime() &&
                        timestamp <= rightDate.getTime())(
                        extractTimestampFromUUIDv7(imageId.split(":")[2]),
                    ),
                );
            if (!selectedItems.length) {
                setShowAlert(true);
                return;
            }

            const count = 200; // take at most 200 pictures
            const result: string[] = [];
            if (count >= selectedItems.length) {
                result.push(...selectedItems);
            } else {
                const interval = selectedItems.length / count; // This can be a float
                for (let i = 0; i < count; i++) {
                    const index = Math.floor(i * interval);
                    result.push(selectedItems[index]);
                }
            }

            const blob = await apiClient.generatePreview({
                projectId: projectId!,
                // setting duration to get 25 fps
                duration:
                    count >= selectedItems.length
                        ? (selectedItems.length / 25) * 1000
                        : 8000,
                images: result,
            });
            const url = URL.createObjectURL(blob);
            setVideoUrl(url);
            ref.current = url;
        }, [items, projectId, start, end, left, right]);

        useEffect(() => {
            s3Api.listObjects().then((objects) => {
                setItems(
                    objects.filter((o) => {
                        return (
                            o.key &&
                            o.key.includes("resolution:tiny:sharpness:blurred")
                        );
                    }),
                );
            });
        }, [projectId]);

        // fetch preview on render (tab switch)
        useEffect(() => {
            if (ref.current) return;
            if (items.length === 0) return;
            fetchPreview();
        }, [items]);

        useEffect(() => {
            if (showAlert) {
                const timer = setTimeout(() => {
                    setShowAlert(false);
                }, 10000);
                return () => clearTimeout(timer);
            }
        }, [showAlert]);

        useEffect(() => {
            apiClient
                .searchHeatmap({
                    projectId: projectId,
                })
                .then((h) => {
                    setStart(new Date(h.start));
                    setEnd(new Date(h.end));
                });
        }, []);

        const handlePlay = async () => {
            setShowAlert(false);
            if (videoUrl) {
                URL.revokeObjectURL(videoUrl);
            }
            fetchPreview();
        };

        function handleRangeChange(left: number, right: number) {
            setLeft(left);
            setRight(right);
        }

        function getLeftDate(): Date {
            const total = end.getTime() - start.getTime();
            return new Date(start.getTime() + total * left);
        }

        function getRightDate(): Date {
            const total = end.getTime() - start.getTime();
            return new Date(start.getTime() + total * right);
        }

        return (
            <div className={`w-full rounded-lg`}>
                {videoUrl ? (
                    <div>
                        <iframe
                            className="w-full aspect-video rounded mb-2"
                            src={videoUrl}
                            title="Video player"
                            allowFullScreen
                        />
                        <div className={`flex gap-2 items-center`}>
                            <Button
                                onClick={handlePlay}
                                size="icon"
                                variant="ghost"
                                className="text-gray-700 border-1"
                                title="Regenerate preview"
                            >
                                <RefreshCcw />
                            </Button>
                            <div className={`border-1 rounded w-full h-fit`}>
                                <div className={`w-full relative`}>
                                    <div
                                        className={`flex justify-between items-center text-sm text-gray-700 absolute top-0 left-0 right-0 bottom-0 h-full px-3 `}
                                    >
                                        <span>
                                            {getLeftDate().toLocaleDateString()}
                                        </span>
                                        <span>
                                            {getRightDate().toLocaleDateString()}
                                        </span>
                                    </div>
                                    <DualSlider
                                        onRangeChange={handleRangeChange}
                                    />
                                </div>
                            </div>
                        </div>
                        {showAlert && (
                            <Alert
                                variant="destructive"
                                className="mt-2 transition-all"
                            >
                                <AlertCircleIcon />
                                <AlertTitle className="font-bold">
                                    Failed to generate preview.
                                </AlertTitle>
                                <AlertDescription>
                                    <p>
                                        There are no images in the selected time
                                        range. Please select a different time
                                        range or upload more images.
                                    </p>
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>
                ) : (
                    <div className="flex justify-center items-center aspect-video">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                )}
            </div>
        );
    },
);
