import React, { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApiClient } from "@/lib/api-client.ts";
import { Label } from "@radix-ui/react-label";
import { Input } from "@/components/ui/input.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { useProjects } from "@/context/project-context";
import { CheckCircle, CircleX, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils.ts";

export const CreateProjectPage: React.FC = () => {
    const { updateProjects } = useProjects();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const apiClient = useApiClient();
    const navigate = useNavigate();
    const [startDate, setStartDate] = useState<Date>(new Date());
    const [endDate, setEndDate] = useState<Date>(new Date());
    const [captureStart, setCaptureStart] = useState<string | undefined>(
        undefined,
    );
    const [captureEnd, setCaptureEnd] = useState<string | undefined>(undefined);
    const [createProjectStatus, setCreateProjectStatus] = React.useState<
        "idle" | "loading" | "success" | "error"
    >("idle");

    const gotoProject = (projectId: string) => {
        navigate(`/project/${projectId}`);
    };

    const createProject = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setCreateProjectStatus("loading");
        let uuid = "";
        try {
            uuid = await apiClient.createProject({
                name: name,
                description: description,
                start: startDate || new Date(),
                end: endDate || new Date(),
                captureStart: captureStart,
                captureEnd: captureEnd,
            });
            setCreateProjectStatus("success");
            updateProjects(); //always needed, because even successfull calls currently return error
            //Timeout of 1s for better UX (Visual feedback for user)
            await new Promise((resolve) => setTimeout(resolve, 1000));
            gotoProject(uuid);
        } catch (e) {
            console.error(`cannot create project ${e}`);
            setCreateProjectStatus("error");
            //Timeout of 1s for better UX (Visual feedback for user)
            await new Promise((resolve) => setTimeout(resolve, 1000));
            navigate("/dashboard");
        }
    };

    const handleDateChange =
        (field: "start-date" | "end-date") =>
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const newDate = new Date(event.target.value);
            if (field === "start-date") {
                //method is used to set startDate and endDate
                setStartDate(newDate);
            } else {
                setEndDate(newDate);
            }
        };

    return (
        <div className="p-4">
            <div className="p-4 grid w-full items-center gap-3.5 border-0 border-t-4">
                <div className="text-3xl font-bold">Create new project</div>
                <form onSubmit={createProject} className="max-w-lg">
                    <div className="mt-4">
                        <Label htmlFor="project-name">
                            Project name
                            <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Input
                            className="mt-0.5"
                            type="text"
                            name="project-name"
                            id="project-name"
                            value={name}
                            onChange={(el) => setName(el.target.value)}
                            placeholder="Name of your project"
                            required
                        />
                    </div>
                    <div className="mt-4">
                        <Label htmlFor="project-description" className="mt-2">
                            Project description
                        </Label>
                        <Textarea
                            placeholder="Description of your project"
                            cols={30}
                            rows={3}
                            id="project-description"
                            value={description}
                            onChange={(el) => setDescription(el.target.value)}
                        ></Textarea>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                        <div className="flex flex-col w-1/2">
                            <label htmlFor="start-date">
                                Start date of project
                                <span className="text-red-500 ml-1">*</span>
                            </label>
                            <input
                                type="date"
                                id="start-date"
                                name="project-start-date"
                                value={formatDate(startDate)}
                                min="2000-01-01"
                                max="2050-12-31"
                                onChange={handleDateChange("start-date")}
                                className="custom-datepicker"
                                required
                            />
                        </div>
                        <div className="flex flex-col ml-4 w-1/2">
                            <label htmlFor="end-date">
                                End date of project
                                <span className="text-red-500 ml-1">*</span>
                            </label>
                            <input
                                type="date"
                                id="end-date"
                                name="project-end-date"
                                value={formatDate(endDate)}
                                min="2000-01-01"
                                max="2050-12-31"
                                onChange={handleDateChange("end-date")}
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
                                value={captureStart}
                                min="00:00"
                                max="23:59"
                                onChange={(
                                    event: React.ChangeEvent<HTMLInputElement>,
                                ) =>
                                    setCaptureStart(
                                        event.target.value
                                            ? event.target.value
                                            : undefined,
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
                                value={captureEnd}
                                min="00:00"
                                max="23:59"
                                onChange={(
                                    event: React.ChangeEvent<HTMLInputElement>,
                                ) =>
                                    setCaptureEnd(
                                        event.target.value
                                            ? event.target.value
                                            : undefined,
                                    )
                                }
                                className="custom-datepicker"
                            />
                        </div>
                    </div>
                    <div className="text-sm text-gray-500 mt-3">
                        * are required
                    </div>
                    <Button
                        className="mt-8 w-full"
                        size="lg"
                        type="submit"
                        disabled={createProjectStatus !== "idle"}
                    >
                        {createProjectStatus === "loading" && (
                            <Loader2 className="mr-2 !h-6 !w-6 animate-spin" />
                        )}
                        {createProjectStatus === "success" && (
                            <CheckCircle className="mr-2 !h-6 !w-6 text-white" />
                        )}
                        {createProjectStatus === "error" && (
                            <CircleX className="mr-2 !h-6 !w-6 text-red-500" />
                        )}
                        Create Project
                    </Button>
                </form>
            </div>
        </div>
    );
};
