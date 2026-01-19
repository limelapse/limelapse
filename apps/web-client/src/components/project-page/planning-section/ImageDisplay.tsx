import React from "react";
import { useProjects } from "@/context/project-context.tsx";

const ImageDisplay: React.FC = () => {
    // use context api to handle selected image
    const { focusedImage } = useProjects();

    return (
        <div id="ImageDisplay">
            <img
                id={focusedImage.imageId}
                src={focusedImage.imageURL}
                alt={`Image ${focusedImage.imageId}`}
                className="w-full h-auto rounded-sm object-contain"
            />
        </div>
    );
};

export default ImageDisplay;
