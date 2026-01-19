import React, { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button";
import { CheckCircle, CircleX, Loader2, Pencil, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { formatDate } from "@/lib/utils.ts";
import { Project, useApiClient } from "@/lib/api-client.ts";
import { useNavigate, useParams } from "react-router-dom";
import { useProjects } from "@/context/project-context.tsx";
import BulkUpload from "./BulkUpload";

const ProjectDetailsPanel: React.FC = () => {
    const { projectId } = useParams();
    const navigate = useNavigate(); // needed for navigation to /dashboard with delete button
    const { updateProjects } = useProjects();
    const [project, setProject] = useState({
        id: "",
        name: "",
        description: "",
        start: new Date(),
        end: new Date(),
        captureStart: null,
        captureEnd: null,
    } as Project);
    const apiClient = useApiClient();
    const [openUpdateProjectDialog, setOpenUpdateProjectDialog] =
        React.useState(false);
    const [temporaryName, setTemporaryName] = useState(project.name);
    const [temporaryDescription, setTemporaryDescription] = useState(
        project.description,
    );
    const [temporaryStartDate, setTemporaryStartDate] = React.useState<Date>(
        new Date(),
    );
    const [temporaryEndDate, setTemporaryEndDate] = React.useState<Date>(
        new Date(),
    );
    const [temporaryCaptureStart, setTemporaryCaptureStart] = useState<
        string | null
    >(project.captureStart);
    const [temporaryCaptureEnd, setTemporaryCaptureEnd] = useState<
        string | null
    >(project.captureEnd);
    const [updateProjectStatus, setUpdateProjectStatus] = useState<
        "idle" | "loading" | "success" | "error"
    >("idle");
    const [openDeleteProjectDialog, setOpenDeleteProjectDialog] =
        React.useState(false);
    const [deleteProjectStatus, setDeleteProjectStatus] = useState<
        "idle" | "loading" | "success" | "error"
    >("idle");

    const handleDateChange =
        (field: "start-date" | "end-date") =>
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const newDate: Date = new Date(event.target.value);
            if (field === "start-date") {
                //method is used to set startDate and endDate
                setTemporaryStartDate(newDate);
            } else {
                setTemporaryEndDate(newDate);
            }
        };

    const updateProject = async () => {
        setUpdateProjectStatus("loading");
        const body = {
            id: projectId || "no-projectID",
            name: temporaryName || project.name,
            description: temporaryDescription || project.description,
            start: temporaryStartDate || project.start,
            end: temporaryEndDate || project.end,
            captureStart: temporaryCaptureStart || project.captureStart,
            captureEnd: temporaryCaptureEnd || project.captureEnd,
        };
        try {
            await apiClient.updateProject(body);
            setUpdateProjectStatus("success");
        } catch (e) {
            console.error(`Cannot update project ${e}`);
            setUpdateProjectStatus("success"); //TODO change to error once we have enhanced error messages
        }
        //Timeout of 1s for better UX (Visual feedback for user)
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setOpenUpdateProjectDialog(false); //needed to close dialog window after saving changes
        setUpdateProjectStatus("idle");
        updateProjects(); //needed for updating sidebar
        updateCurrentProject(); //needed for updating current project
    };

    const deleteProject = async () => {
        setDeleteProjectStatus("loading");
        try {
            if (!projectId) {
                throw new Error("projectIdOfSelectedProject is undefined");
            }
            await apiClient.deleteProject(projectId);
            console.log(
                `Deleting project with ID ${projectId} was successful.`,
            );
            setDeleteProjectStatus("success");
        } catch (e) {
            console.error(`Failed to delete project with ID ${projectId}.`, e);
            setDeleteProjectStatus("success"); //TODO change to "error" when improved error handling is available
        }
        updateProjects(); //triggering fetching of projects before navigating to dashboard
        //Timeout of 1s for better UX (Visual feedback for user)
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setOpenDeleteProjectDialog(false);
        navigate("/dashboard");
    };

    const updateCurrentProject = async () => {
        if (!projectId) {
            return;
        }

        try {
            const currentProject = await apiClient.getProject(projectId);
            setProject(currentProject);
        } catch (error) {
            console.error("fetch projects failed", error);
        }
    };

    useEffect(() => {
        updateCurrentProject();
    }, [projectId]);

    useEffect(() => {
        // updating of data: needed in case project is edited and then project is switched
        setTemporaryName(project.name);
        setTemporaryDescription(project.description);
        setTemporaryStartDate(project.start);
        setTemporaryEndDate(project.end);
        setTemporaryCaptureStart(project.captureStart);
        setTemporaryCaptureEnd(project.captureEnd);
    }, [project]);

    return (
        <div id="ProjectDetailsPanel">
            <div className="flex items-center p-4 pl-0 pb-0 max-w-6xl">
                <div className="w-2/3 flex items-center">
                    <div className="text-3xl">
                        Your project:
                        <span className="ml-1 font-bold">{project.name}</span>
                    </div>
                    <Dialog
                        open={openUpdateProjectDialog}
                        onOpenChange={setOpenUpdateProjectDialog}
                    >
                        <DialogTrigger asChild>
                            <div className="ml-6 mr-2">
                                <Button
                                    className="text-gray-700"
                                    variant="outline"
                                    size="icon"
                                >
                                    <Pencil />
                                </Button>
                            </div>
                        </DialogTrigger>
                        <DialogContent className="max-w-[425px] md:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Edit project</DialogTitle>
                                <DialogDescription>
                                    Make changes to your project here. Click
                                    save when you're done.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="max-w-lg">
                                <div className="mt-4">
                                    <Label htmlFor="project-name">
                                        Project name
                                        <span className="text-red-500 ml-1">
                                            *
                                        </span>
                                    </Label>
                                    <Input
                                        className="mt-0.5"
                                        type="text"
                                        name="project-name"
                                        id="project-name"
                                        value={temporaryName}
                                        onChange={(el) =>
                                            setTemporaryName(el.target.value)
                                        }
                                        placeholder={temporaryName}
                                    />
                                </div>
                                <div className="mt-4">
                                    <Label
                                        htmlFor="project-description"
                                        className="mt-2"
                                    >
                                        Project description
                                    </Label>
                                    <Textarea
                                        placeholder={temporaryDescription}
                                        cols={30}
                                        rows={3}
                                        id="project-description"
                                        value={temporaryDescription}
                                        onChange={(el) =>
                                            setTemporaryDescription(
                                                el.target.value,
                                            )
                                        }
                                    ></Textarea>
                                </div>
                                <div className="mt-4 flex items-center justify-between">
                                    <div className="flex flex-col w-1/2">
                                        <label htmlFor="start-date">
                                            Start date of project
                                            <span className="text-red-500 ml-1">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="date"
                                            id="start-date"
                                            name="project-start-date"
                                            value={formatDate(
                                                temporaryStartDate,
                                            )}
                                            min="2000-01-01"
                                            max="2050-12-31"
                                            onChange={handleDateChange(
                                                "start-date",
                                            )}
                                            className="custom-datepicker"
                                            required
                                        />
                                    </div>
                                    <div className="flex flex-col ml-4 w-1/2">
                                        <label htmlFor="end-date">
                                            End date of project
                                            <span className="text-red-500 ml-1">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="date"
                                            id="end-date"
                                            name="project-end-date"
                                            value={formatDate(temporaryEndDate)}
                                            min="2000-01-01"
                                            max="2050-12-31"
                                            onChange={handleDateChange(
                                                "end-date",
                                            )}
                                            className="custom-datepicker"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center justify-between">
                                    <div className="flex flex-col w-1/2">
                                        <label htmlFor="capture-start">
                                            Start time for capturing
                                        </label>
                                        <input
                                            type="time"
                                            id="capture-start"
                                            name="capture-start-time"
                                            value={
                                                temporaryCaptureStart ??
                                                undefined
                                            }
                                            min="00:00"
                                            max="23:59"
                                            onChange={(
                                                event: React.ChangeEvent<HTMLInputElement>,
                                            ) =>
                                                setTemporaryCaptureStart(
                                                    event.target.value
                                                        ? event.target.value
                                                        : null,
                                                )
                                            }
                                            className="custom-datepicker"
                                        />
                                    </div>
                                    <div className="flex flex-col ml-4 w-1/2">
                                        <label htmlFor="capture-end">
                                            End time for capturing
                                        </label>
                                        <input
                                            type="time"
                                            id="capture-end"
                                            name="capture-end-time"
                                            value={
                                                temporaryCaptureEnd ?? undefined
                                            }
                                            min="00:00"
                                            max="23:59"
                                            onChange={(
                                                event: React.ChangeEvent<HTMLInputElement>,
                                            ) =>
                                                setTemporaryCaptureEnd(
                                                    event.target.value
                                                        ? event.target.value
                                                        : null,
                                                )
                                            }
                                            className="custom-datepicker"
                                        />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    onClick={updateProject}
                                    disabled={updateProjectStatus !== "idle"}
                                >
                                    {updateProjectStatus === "loading" && (
                                        <Loader2 className="mr-2 !h-6 !w-6 animate-spin" />
                                    )}
                                    {updateProjectStatus === "success" && (
                                        <CheckCircle className="mr-2 !h-6 !w-6 text-white" />
                                    )}
                                    {updateProjectStatus === "error" && (
                                        <CircleX className="mr-2 !h-6 !w-6 text-red-500" />
                                    )}
                                    Save changes
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    <BulkUpload projectId={projectId!}></BulkUpload>
                    <Dialog
                        open={openDeleteProjectDialog}
                        onOpenChange={setOpenDeleteProjectDialog}
                    >
                        <DialogTrigger asChild>
                            <Button
                                className="ml-2 text-red-500 hover:text-red-700"
                                variant="ghost"
                                size="icon"
                            >
                                <Trash2 />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-[425px] md:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>
                                    Do you want to delete project '
                                    {project.name}'?
                                </DialogTitle>
                                <DialogDescription>
                                    This action cannot be undone. Once you
                                    delete the project, it cannot be restored
                                    and your images are deleted.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="max-w-lg">
                                <div className="mt-4">
                                    <div className="text-xl font-bold">
                                        Project to be deleted:
                                    </div>
                                    <div>
                                        <div className="text-lg mt-4">
                                            Title:{" "}
                                            {project.name || "Untitled Project"}
                                        </div>
                                        <div className="text-gray-600 mt-1 mb-4">
                                            Description:{" "}
                                            {project.description ||
                                                "No description provided."}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    className="bg-red-500 hover:bg-red-600"
                                    onClick={deleteProject}
                                    disabled={deleteProjectStatus !== "idle"}
                                >
                                    {deleteProjectStatus === "loading" && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    {deleteProjectStatus === "success" && (
                                        <CheckCircle className="mr-2 h-4 w-4 text-white" />
                                    )}
                                    {deleteProjectStatus === "error" && (
                                        <CircleX className="mr-2 h-4 w-4 text-red-500" />
                                    )}
                                    Yes, delete this project
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
                <div className="w-1/3">
                    <div className="flex items-center font-bold justify-end">
                        Camera status
                        <span className="ml-2 h-8 w-8 rounded-full bg-lime-500 inline-block" />
                    </div>
                </div>
            </div>
            <div className="flex items-start p-4 pl-0 max-w-6xl">
                <div className="w-2/3">
                    {project.start !== undefined &&
                        project.end !== undefined && (
                            <div className="text-sm text-gray-500 mb-2">
                                <span>From: {formatDate(project.start)}</span>
                                <span className="mx-1">until</span>
                                <span>{formatDate(project.end)}</span>
                            </div>
                        )}
                    <div className="pr-8">{project.description}</div>
                </div>
                <div className="w-1/3 text-right">
                    Last image: <span>4 minutes ago</span>
                </div>
            </div>
        </div>
    );
};

export default ProjectDetailsPanel;
