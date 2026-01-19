import React from "react";
import ImageDisplay from "@/components/project-page/planning-section/ImageDisplay.tsx";
import ImageControls from "@/components/project-page/planning-section/ImageControls.tsx";
import { useProjects } from "@/context/project-context.tsx";

const PlanningSection: React.FC = () => {
    const { focusedImage } = useProjects();

    //focusedImage.imageId==="" basically refers to "has an image already been selected?" --> similar to loading spinner
    return focusedImage.imageId === "" ? (
        <div id="PlanningSection" className="flex justify-center flex-col">
            <div className="font-bold">No image selected</div>
            <div className="text-lg">
                Select an image to look at it more closely
            </div>
        </div>
    ) : (
        <div id="PlanningSection">
            {/*shows the focussed image with img tag */}
            <ImageDisplay />

            {/*changes the focussed image when clicking on next button*/}
            <ImageControls />
        </div>
    );
};

export default PlanningSection;
