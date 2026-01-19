import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { useProjects } from "@/context/project-context";

const DashboardPage: React.FC = () => {
    const { projects, isLoadingProjects } = useProjects();
    const hasExistingProjects = (projects?.length ?? 0) > 0;

    const renderProjectList = () => {
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {projects?.map((project) => (
                    <Link
                        to={`/project/${project.id}`}
                        key={project.id}
                        className="border p-4 rounded shadow-sm flex flex-col justify-between border-lime-500 drop-shadow-s"
                    >
                        <div>
                            <div className="text-xl font-bold">
                                {project.name || "Untitled Project"}
                            </div>
                            <div className="text-gray-600 mb-4">
                                {project.description ||
                                    "No description provided."}
                            </div>
                        </div>
                        <div className="text-sm text-gray-500">
                            <div>
                                Start: {project.start.toLocaleDateString()}
                            </div>
                            <div>End: {project.end.toLocaleDateString()}</div>
                        </div>
                    </Link>
                ))}
            </div>
        );
    };

    const renderEmptyProjectList = () => {
        return (
            <div className="p-4 border-0 border-t-4">
                <div className="text-3xl">
                    <span className="font-bold">No projects to show</span>
                </div>
                <div className="text-xl">
                    Would you like to create a new project?
                </div>
                <Link to="/create-project">
                    <Button className="mt-4">Create Project</Button>
                </Link>
            </div>
        );
    };

    const renderLoadingSpinner = () => (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 7 }).map((_, index) => (
                <div
                    key={index}
                    className="mx-auto w-full max-w-sm rounded-md border border-lime-500 p-4 animate-pulse"
                >
                    <div className="space-y-4">
                        <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                        <div className="pt-2 border-t border-gray-200">
                            <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderProjectOverview = () =>
        hasExistingProjects ? renderProjectList() : renderEmptyProjectList();
    return (
        <div className="p-4">
            {isLoadingProjects
                ? renderLoadingSpinner()
                : renderProjectOverview()}
        </div>
    );
};

export default DashboardPage;
