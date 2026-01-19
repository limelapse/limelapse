import React, { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { useS3Api } from "@/lib/s3-client";
import { Check } from "lucide-react";
import { useProjects } from "@/context/project-context.tsx";
import { FocusedImage } from "@/lib/FocusedImage.ts";

interface PictureProps {
    imageId: string;
    projectId: string;
    onSelect?: (imageId: string) => void;
    selectable?: boolean;
}

export const PictureComponent: React.FC<PictureProps> = ({
    imageId,
    projectId,
    onSelect,
    selectable = true,
}) => {
    const api = useS3Api(projectId);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(false);
    const localStorageKey = `selected-${projectId}-${imageId}`;
    const { setFocusedImage } = useProjects();

    // Checks localStorage for a previously saved selection state for this specific image and restores selection state
    useEffect(() => {
        if (!selectable) return;
        const stored = localStorage.getItem(localStorageKey);
        setSelected(stored === "true");
    }, [imageId, projectId]);

    useEffect(() => {
        let isCancelled = false;
        if (!imageId) return;
        setLoading(true);
        api.getImageById(imageId).then((result) => {
            if (isCancelled || !result) return;
            const url = URL.createObjectURL(result.blob);
            setImageUrl(url);
            setLoading(false);
        });

        // Cleanup to revoke URL and avoid memory leaks
        return () => {
            isCancelled = true;
            if (imageUrl) {
                URL.revokeObjectURL(imageUrl);
            }
        };
    }, [imageId, projectId]);

    // User clicks white square / blue box with checkmark to select image for timelapse export
    const handleSelectionToggle = (event: any) => {
        event.stopPropagation(); // needed so that handleImageClick is not executed as well
        console.log("image would be selected; selectable: " + !selectable);
        if (!selectable) return;
        const newSelected = !selected;
        setSelected(newSelected);
        localStorage.setItem(localStorageKey, String(newSelected));
        onSelect?.(imageId);
    };

    // User clicks image in order to view this image on larger preview (focus image)
    const handleImageClick = () => {
        if (imageUrl && imageId) {
            const focusedImage: FocusedImage = {
                imageURL: imageUrl,
                imageId: imageId,
            };
            setFocusedImage(focusedImage);
        }
    };

    return (
        <div
            onClick={handleImageClick}
            className={`w-full rounded-lg bg-background shadow-inner`}
            id="PictureComponent"
        >
            <div
                onClick={handleSelectionToggle}
                className={`absolute ml-1 mt-1 w-4 h-4 shadow-inner rounded-xs overflow-visible transition-colors duration-200 border-1 border-gray-400 ${selected ? "bg-blue-400" : "bg-white"}`}
            >
                <div className="pr-3">
                    <Check className=" text-white pr-0.5" size="16" />
                </div>
            </div>
            {loading ? (
                <Skeleton className="w-full aspect-video rounded-sm" />
            ) : imageUrl ? (
                <img
                    src={imageUrl}
                    alt={`Image ${imageId}`}
                    className="w-full h-auto rounded-sm object-contain"
                />
            ) : (
                <div className="text-sm text-muted-foreground text-center py-4">
                    Image not found
                </div>
            )}
        </div>
    );
};
