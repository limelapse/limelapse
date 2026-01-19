export default class ProjectsService {
    public static async getProjects(bearer: string): Promise<Project[]> {
        const response = await fetch(
            import.meta.env.VITE_LIST_PROJECTS_ENDPOINT,
            {
                headers: {
                    Authorization: `Bearer ${bearer}`,
                },
            },
        );
        if (response.status !== 200) {
            throw response;
        }
        const projects: Project[] = await response.json();

        return projects.map((p) => ProjectsService.parseProject(p));
    }

    public static async getProjectById(
        bearer: string,
        id: string,
    ): Promise<Project> {
        const response = await fetch(
            import.meta.env.VITE_GET_PROJECT_ENDPOINT,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${bearer}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(id),
            },
        );
        if (response.status !== 200) {
            throw response;
        }
        const project: Project = await response.json();

        return ProjectsService.parseProject(project);
    }

    private static parseProject(project: Project): Project {
        project.start = new Date(project.start);
        project.end = new Date(project.end);

        return project;
    }
}

export interface Project {
    id: string;
    name: string;
    description: string;
    start: Date;
    end: Date;
    captureStart?: string;
    captureEnd?: string;
}
