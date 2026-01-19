import React from "react";
import { CirclePlay, CirclePause, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { useProjects } from "@/context/project-context.tsx";
import { useS3Api } from "@/lib/s3-client";
import { useParams } from "react-router-dom";
import { SearchResult } from "@/lib/api-client.ts";
import { FocusedImage } from "@/lib/FocusedImage.ts";

const ImageControls: React.FC = () => {
    const { currentPageOfSearchResults, focusedImage, setFocusedImage } =
        useProjects();
    const { projectId } = useParams();
    const api = useS3Api(projectId ?? "ImageControlFindsNoProjectId"); //TODO consider refactoring

    const getNextImage = async () => {
        // const index = currentPageOfSearchResults.hits.indexOf(focusedImage.imageId);
        let index = currentPageOfSearchResults.hits.findIndex(
            (hit) => hit.imageId === focusedImage.imageId,
        );

        const numberOfResultImagesForCurrentPage =
            currentPageOfSearchResults.hits.length;
        if (index >= 0 && index < numberOfResultImagesForCurrentPage - 1) {
            index++;
        } else {
            index = 0;
        }
        let nextImage: SearchResult = currentPageOfSearchResults.hits[index];
        const imageIdOfNextImage: string = nextImage.imageId;
        const updatedURL: string = await updateFocusedImage(imageIdOfNextImage);
        const nextFocusedImage: FocusedImage = {
            imageURL: updatedURL,
            imageId: imageIdOfNextImage,
        };
        setFocusedImage(nextFocusedImage);
    };

    const fetchURLOfFocusedImageId = async (
        focusedImageId: string,
    ): Promise<string> => {
        if (!focusedImageId) return "Error, no focus image id";

        try {
            const result = await api.getImageById(focusedImageId);
            if (!result) return "Error, no result";
            const focusedImageURL = URL.createObjectURL(result.blob);
            return focusedImageURL;
        } catch (error) {
            console.error(
                "Error in ImageControls:fetchURLOfFocusedImageId: " + error,
            );
            return "ErrorWhenFetchingURL";
        }
    };

    const updateFocusedImage = async (
        focusedImageId: string,
    ): Promise<string> => {
        let updatedURL = fetchURLOfFocusedImageId(focusedImageId);
        return updatedURL;
    };

    return (
        <div id="ImageControls" className="bg-muted mt-2 p-2 rounded-md">
            <div className="flex justify-between items-center">
                <Button
                    onClick={() => {
                        console.log("Todo Arrow Left");
                    }}
                >
                    <ArrowLeft />
                </Button>
                <div className="flex">
                    <Button
                        onClick={() => {
                            console.log("Todo Play Button");
                        }}
                        className="mr-2"
                    >
                        <CirclePlay size={48} />
                    </Button>
                    <Button
                        onClick={() => {
                            console.log("Todo Pause Button");
                        }}
                    >
                        <CirclePause />
                    </Button>
                    <div>Heatmap (TODO)</div>
                </div>
                <Button
                    onClick={() => {
                        getNextImage();
                    }}
                >
                    <ArrowRight />
                </Button>
            </div>
            {/*<div>Test: {focusedImage.imageId}</div>
            <div className="mt-4">
                {currentPageOfSearchResults.hits.map((el) => (
                    <div>{el.imageId}</div>
                ))}
            </div>*/}
        </div>
    );
};

export default ImageControls;
