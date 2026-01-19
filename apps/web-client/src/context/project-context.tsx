import React, { createContext, useContext, useEffect, useState } from "react";
import { Project, SearchResults, useApiClient } from "@/lib/api-client";
import { Outlet } from "react-router-dom";
import { FocusedImage } from "@/lib/FocusedImage.ts";

type ProjectContextType = {
    projects: Project[] | undefined;
    isLoadingProjects: boolean;
    updateProjects: () => Promise<void>;
    focusedImage: FocusedImage;
    setFocusedImage: (image: FocusedImage) => void;
    resetFocusedImage: () => void;
    currentPageOfSearchResults: SearchResults;
    setCurrentPageOfSearchResults: (
        currentPageOfResults: SearchResults,
    ) => void;
    resetCurrentPageOfSearchResults: () => void;
};

const ProjectContext = createContext<ProjectContextType | null>(null);

const ProjectProvider: React.FC = () => {
    const apiClient = useApiClient();

    const [projects, setProjects] = useState<Project[] | undefined>(undefined);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [focusedImage, setFocusedImage] = useState<FocusedImage>({
        imageURL: "",
        imageId: "",
    });
    const [currentPageOfSearchResults, setCurrentPageOfSearchResults] =
        useState<SearchResults>({
            hits: [],
            totalResults: 0,
        });

    useEffect(() => {
        updateProjects();
    }, []);

    const updateProjects = async () => {
        setIsLoading(true);
        try {
            const projects = await apiClient.listProjects();
            setProjects(projects);
        } catch (err) {
            console.error("Fetching projects failed", err);
        }
        setIsLoading(false);
    };

    //used in ProjectPage: each time a project is switched, the currently selected image is reset
    const resetFocusedImage = () => {
        setFocusedImage({ imageURL: "", imageId: "" });
    };

    const resetCurrentPageOfSearchResults = () => {
        setCurrentPageOfSearchResults({
            hits: [],
            totalResults: 0,
        });
    };

    return (
        <ProjectContext.Provider
            value={{
                projects,
                isLoadingProjects: isLoading,
                updateProjects,
                focusedImage,
                setFocusedImage,
                resetFocusedImage,
                currentPageOfSearchResults,
                setCurrentPageOfSearchResults,
                resetCurrentPageOfSearchResults,
            }}
        >
            <Outlet />
        </ProjectContext.Provider>
    );
};

export function useProjects(): ProjectContextType {
    const context = useContext(ProjectContext);
    if (!context) {
        throw new Error("useProjects must be used within an ProjectProvider");
    }
    return context;
}

export default ProjectProvider;
