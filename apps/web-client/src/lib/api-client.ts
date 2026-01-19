import { useMemo } from "react";
import { useKeycloak } from "../context/keycloak-context.tsx";
import { parseDate, parseTime } from "./utils.ts";

const PROTOCOL = import.meta.env.VITE_API_CLIENT_PROTOCOL;
export const DOMAIN_POSTFIX = import.meta.env.VITE_DOMAIN_POSTFIX;

const buildUrl = (
    service: string,
    path: string,
    query?: Record<string, string | number | boolean | undefined>,
): string => {
    const base = `${PROTOCOL}://${service}.${DOMAIN_POSTFIX}${path}`;
    if (!query) return base;

    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) {
            params.append(key, String(value));
        }
    }

    return `${base}?${params.toString()}`;
};

type ResponseType = "json" | "blob" | "arrayBuffer";

interface RequestOptions extends Omit<RequestInit, "headers"> {
    service: string;
    path: string;
    query?: Record<string, string | number | boolean | undefined>;
    headers?: Record<string, string>;
    body?: BodyInit | null | undefined;
    responseType?: ResponseType;
}

const useRawApi = () => {
    const keycloak = useKeycloak();

    return useMemo(() => {
        return async function rawApi<T>({
            service,
            path,
            query,
            body,
            headers = {},
            responseType = "json",
            ...options
        }: RequestOptions): Promise<T> {
            const url = buildUrl(service, path, query);
            const token = keycloak.user?.access_token;

            const response = await fetch(url, {
                method: options.method ?? "GET",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    ...headers,
                },
                body: body ?? undefined,
                cache: options.cache,
                mode: options.mode,
                credentials: options.credentials,
                redirect: options.redirect,
                referrer: options.referrer,
                referrerPolicy: options.referrerPolicy,
                keepalive: options.keepalive,
            } as RequestInit);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API error ${response.status}: ${errorText}`);
            }

            try {
                switch (responseType) {
                    case "blob":
                        return (await response.blob()) as T;
                    case "arrayBuffer":
                        return (await response.arrayBuffer()) as T;
                    case "json":
                    default:
                        return (await response.json()) as T;
                }
            } catch (err) {
                throw new Error(
                    `Failed to parse JSON: ${(err as Error).message}`,
                );
            }
        };
    }, [keycloak]);
};

export const useApiClient = () => {
    const request = useRawApi();

    return {
        listProjects: async (): Promise<Project[]> => {
            const projects = await request<any[]>({
                service: "function-list-projects",
                path: `/list`,
            });

            const parsedProjects: Project[] = [];
            projects.forEach((project) =>
                parsedProjects.push(parseProject(project)),
            );

            return parsedProjects;
        },
        getProject: async (id: string): Promise<Project> => {
            const project = await request<any>({
                service: "function-list-projects",
                path: `/get`,
                method: "POST",
                body: JSON.stringify(id),
            });

            return parseProject(project);
        },
        createProject: (body: CreateProject) =>
            request<string>({
                service: "function-create-project",
                path: "/create",
                method: "POST",
                body: JSON.stringify(body),
            }),
        updateProject: (body: UpdateProject) =>
            request<string>({
                service: "function-update-project",
                path: "/update",
                method: "POST",
                body: JSON.stringify(body),
            }),
        deleteProject: (id: string) =>
            request<string>({
                service: "function-delete-project",
                path: "/delete",
                method: "POST",
                body: JSON.stringify(id),
            }),
        getPresignedUploadUrl: (body: UploadFile) =>
            request<string>({
                service: "function-file-upload",
                path: "/upload",
                method: "POST",
                body: JSON.stringify(body),
            }),
        getFileAccess: (projectId?: string) =>
            request<Credentials>({
                service: "function-file-access",
                path: "/files",
                method: "POST",
                body: projectId ? JSON.stringify(projectId) : undefined,
            }),
        generateVideo: (projectId: string, images: string[]) =>
            request<string>({
                service: "function-generate-video",
                path: "/generate",
                method: "POST",
                body: JSON.stringify({ projectId: projectId, images: images }),
            }),
        generatePreview: (body: GeneratePreviewRequest) =>
            request<Blob>({
                service: "function-generate-preview",
                path: "/generate",
                method: "POST",
                body: JSON.stringify(body),
                responseType: "blob",
            }),
        listVideos: (projectId: string) =>
            request<string[]>({
                service: "function-list-videos",
                path: "/list",
                method: "POST",
                body: JSON.stringify(projectId),
            }),
        getVideo: (projectId: string, videoId: string) =>
            request<string>({
                service: "function-get-video",
                path: "/get",
                method: "POST",
                body: JSON.stringify({
                    projectId: projectId,
                    videoId: videoId,
                }),
            }),
        deleteVideo: (projectId: string, videoId: string) =>
            request<string>({
                service: "function-delete-video",
                path: "/delete",
                method: "POST",
                body: JSON.stringify({
                    projectId: projectId,
                    videoId: videoId,
                }),
            }),
        search: (body: SearchParameters) =>
            request<SearchResults>({
                service: "function-search-image",
                path: "/search",
                method: "POST",
                body: JSON.stringify(body),
            }),
        searchHeatmap: (body: SearchHeatmapParameters) =>
            request<SearchHeatmapResults>({
                service: "function-search-heatmap",
                path: "/search",
                method: "POST",
                body: JSON.stringify(body),
            }),
    };
};

export interface CreateProject {
    name: string;
    description: string;
    start: Date;
    end: Date;
    captureStart?: string;
    captureEnd?: string;
}

export interface GeneratePreviewRequest {
    projectId: string;
    images: string[]; // Equidistant image identifiers
    duration: number; // Duration in milliseconds
}

export interface UpdateProject {
    id: string;
    name?: string;
    description?: string;
    start?: Date;
    end?: Date;
    captureStart: string | null;
    captureEnd: string | null;
}

export interface Project {
    id: string;
    name: string;
    description: string;
    start: Date;
    end: Date;
    captureStart: string | null;
    captureEnd: string | null;
}

export interface UploadFile {
    projectId: string;
    timestamp?: number;
}

export interface SearchParameters {
    projectId: string;
    query?: string;
    timeStart?: number;
    timeEnd?: number;
    page?: number;
    size?: number;
}
export interface SearchHeatmapParameters {
    projectId: string;
    query?: string;
    timeStart?: number;
    timeEnd?: number;
}

export interface SearchHeatmapResults {
    heatmap: number[];
    start: number;
    end: number;
}

export interface SearchResults {
    totalResults: number;
    hits: SearchResult[];
}

export interface SearchResult {
    imageId: string;
    distance: number;
}

interface MinioPresignedRequest extends RequestInit {
    url: string;
}

export const useMinioApiClient = () => {
    const request = useMemo(() => {
        return async function rawApi<T>({
            url,
            body,
            ...options
        }: MinioPresignedRequest): Promise<T> {
            const response = await fetch(url, {
                method: options.method ?? "GET",
                headers: options.headers,
                body: body ?? undefined,
                cache: options.cache,
                mode: options.mode,
                credentials: options.credentials,
                redirect: options.redirect,
                referrer: options.referrer,
                referrerPolicy: options.referrerPolicy,
                keepalive: options.keepalive,
            } as RequestInit);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(
                    `Minio API error ${response.status}: ${errorText}`,
                );
            }

            try {
                return response.body as T;
            } catch (err) {
                throw new Error(
                    `Failed to parse JSON: ${(err as Error).message}`,
                );
            }
        };
    }, []);
    return {
        upload: (url: string, body: File) =>
            request<null>({
                url: url,
                body: body,
                method: "PUT",
                headers: { "Content-Type": body.type },
            }),
        download: (url: string) =>
            request<Blob>({
                url: url,
            }),
    };
};

export interface CreateProject {
    name: string;
    description: string;
    start: Date;
    end: Date;
}

export interface UploadFile {
    projectId: string;
    timestamp?: number;
}

export interface Credentials {
    accessKey: string;
    secretKey: string;
    sessionToken: string;
}

export interface Video {
    id: string;
    status: string;
    createdAt: string;
}

function parseProject(project: any): Project {
    return {
        ...project,
        start: parseDate(project.start),
        end: parseDate(project.end),
        captureStart: parseTime(project.captureStart),
        captureEnd: parseTime(project.captureEnd),
    };
}
