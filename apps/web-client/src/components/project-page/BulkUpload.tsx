import React, {
    ChangeEvent,
    useRef,
    useState,
    KeyboardEvent,
    MouseEvent,
    DragEvent,
} from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { CheckCircle, Loader2, Upload } from "lucide-react";
import { useApiClient, useMinioApiClient } from "@/lib/api-client";
import { twMerge } from "tailwind-merge";

const BulkUpload: React.FC<{ projectId: string }> = (props) => {
    const apiClient = useApiClient();
    const minioClient = useMinioApiClient();

    const [uploadStatus, setUploadStatus] = useState<
        "idle" | "loading" | "success" | "failed"
    >("idle");
    const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [dialogOpen, setDialogOpen] = React.useState(false);

    const handleUploadImages = async () => {
        if (selectedFiles && selectedFiles.length > 0) {
            setUploadStatus("loading");
            const uploadPromises = Array.from(selectedFiles).map(
                async (file) => {
                    let epochMillis;
                    try {
                        epochMillis = Number(file.name.split("_")[0]);
                    } catch (_) {
                        epochMillis = null;
                    }
                    const body = epochMillis
                        ? { projectId: props.projectId, timestamp: epochMillis }
                        : { projectId: props.projectId };
                    return await apiClient
                        .getPresignedUploadUrl(body)
                        .then((url) => minioClient.upload(url, file))
                        .catch((error) => {
                            console.error("Failed to upload file:", error);
                            throw error;
                        });
                },
            );
            try {
                await Promise.all(uploadPromises);
                setUploadStatus("success");
                setSelectedFiles(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
                setTimeout(() => setUploadStatus("idle"), 2000);
            } catch (error) {
                setUploadStatus("idle");
            }
        }
    };

    const dropHandle = (event: DragEvent<HTMLInputElement>) => {
        console.log("dropHandle");
        event.preventDefault();

        const items = event.dataTransfer?.items;
        if (!items) return;

        console.log(items);

        const droppedFiles: File[] = [];

        for (const item of items) {
            if (item.kind === "file") {
                const file = item.getAsFile();
                if (file) {
                    droppedFiles.push(file);
                }
            }
        }

        if (droppedFiles.length === 0) return;

        // Convert to FileList using DataTransfer
        const dataTransfer = new DataTransfer();
        droppedFiles.forEach((file) => dataTransfer.items.add(file));

        setSelectedFiles(dataTransfer.files);
    };

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        const newFiles = event.target.files;
        if (!newFiles) return;

        setSelectedFiles(newFiles);
    };

    return (
        <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
                setDialogOpen(open);
                if (open) {
                    setSelectedFiles(null);
                }
            }}
        >
            <DialogTrigger asChild>
                <Button className="text-gray-700" variant="outline" size="icon">
                    <Upload />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Bulk upload</DialogTitle>
                    <DialogDescription>
                        Upload multiple images from your computer. <br />
                        Prefix image names with Unix epoch milliseconds (e.g.,
                        1707123456789_image.jpg) to ensure correct ordering.
                    </DialogDescription>
                </DialogHeader>
                <Dropzone
                    id="dropzone"
                    onDrop={dropHandle}
                    onDragOver={(e) => e.preventDefault()}
                    onChange={handleChange}
                    className="min-w-80 w-full h-30"
                    accept="image/jpeg"
                    multiple
                >
                    <svg
                        aria-hidden="true"
                        className="w-10 h-10 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                    </svg>
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-semibold">Click to upload</span>{" "}
                        or <span className="font-semibold">drag and drop</span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        JPG
                    </p>
                </Dropzone>
                <div className="flex justify-center">
                    {selectedFiles && (
                        <p>
                            {selectedFiles.length}{" "}
                            {selectedFiles.length === 1 ? "file" : "files"}{" "}
                            selected for upload.
                        </p>
                    )}
                </div>
                <DialogFooter>
                    <Button
                        className="w-full"
                        onClick={handleUploadImages}
                        disabled={
                            !selectedFiles ||
                            selectedFiles.length === 0 ||
                            uploadStatus === "loading"
                        }
                    >
                        {uploadStatus === "loading" && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {uploadStatus === "success" && (
                            <CheckCircle className="mr-2 h-4 w-4 text-white" />
                        )}
                        Upload
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default BulkUpload;

interface DropzoneProps extends React.InputHTMLAttributes<HTMLInputElement> {
    value?: string;
    files?: FileList;
    defaultClass?: string;
    children?: React.ReactNode;
}

const Dropzone: React.FC<DropzoneProps> = ({
    value = "",
    files,
    defaultClass = "flex flex-col justify-center items-center w-full h-64 bg-gray-50 rounded-lg border-2 border-gray-300 border-dashed cursor-pointer dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600",
    className,
    children,
    onChange,
    ...rest
}) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleKeyDown = (ev: KeyboardEvent<HTMLButtonElement>) => {
        if (ev.key === " " || ev.key === "Enter") {
            ev.preventDefault();
            inputRef.current?.click();
        }
    };

    const handleClick = (ev: MouseEvent<HTMLButtonElement>) => {
        ev.preventDefault();
        inputRef.current?.click();
    };

    const handleDrop = (e: React.DragEvent<HTMLButtonElement>) => {
        e.preventDefault();

        const files = Array.from(e.dataTransfer.files);
        if (files.length === 0) return;

        // Create new FileList with DataTransfer
        const dataTransfer = new DataTransfer();
        files.forEach((file) => dataTransfer.items.add(file));

        if (inputRef.current) {
            inputRef.current.files = dataTransfer.files;

            // Fire onChange manually if needed
            const event = new Event("change", { bubbles: true });
            inputRef.current.dispatchEvent(event);
        }
    };

    return (
        <>
            <button
                type="button"
                className={twMerge(defaultClass, className)}
                onClick={handleClick}
                onKeyDown={handleKeyDown}
                onFocus={() => {}}
                onBlur={() => {}}
                onMouseEnter={() => {}}
                onMouseLeave={() => {}}
                onMouseOver={() => {}}
                onDragEnter={() => {}}
                onDragLeave={() => {}}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
            >
                {children}
            </button>
            <label className="hidden">
                <input
                    ref={inputRef}
                    type="file"
                    value={value}
                    onChange={onChange}
                    {...rest}
                />
            </label>
        </>
    );
};
