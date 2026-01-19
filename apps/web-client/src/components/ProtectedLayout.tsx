import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb.tsx";
import { Outlet, useLocation } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { useProjects } from "@/context/project-context";

interface BreadCrumbType {
    name: string;
    path: string;
}

export function ProtectedLayout() {
    const location = useLocation();
    const { projects } = useProjects();
    const [breadCrumbs, setBreadCrumbs] = useState<BreadCrumbType[]>([]);

    useEffect(() => {
        const pathSegments = location.pathname
            .split("/")
            .filter((path) => path.length > 0);
        const newBreadCrumbs: BreadCrumbType[] = [
            {
                name: "Home",
                path: "/dashboard",
            },
        ];

        if (pathSegments.length < 1) {
            return;
        }

        if (pathSegments[0] == "create-project") {
            newBreadCrumbs.push({
                name: "Create Project",
                path: "/create-project",
            });
        } else if (pathSegments[0] == "project" && pathSegments[1]) {
            const id = pathSegments[1];
            const name = projects?.find((p) => p.id === id)?.name;

            newBreadCrumbs.push({
                name: `Project ${name ? `"${name}"` : ""}`,
                path: `/project/${id}`,
            });
        }

        setBreadCrumbs(newBreadCrumbs);
    }, [location, projects]);

    return (
        <SidebarProvider>
            <AppSidebar />
            <main className="w-full">
                <div className="flex items-center p-4 pb-0">
                    <div>
                        <SidebarTrigger />
                        {/*this is the button which hides/shows the sidebar*/}
                    </div>
                    <div>
                        <Breadcrumb>
                            <BreadcrumbList>
                                {breadCrumbs.map((crumb, index) => {
                                    const isLast =
                                        index === breadCrumbs.length - 1;

                                    return (
                                        <React.Fragment key={index}>
                                            <BreadcrumbItem>
                                                {isLast ? (
                                                    <BreadcrumbPage>
                                                        {crumb.name}
                                                    </BreadcrumbPage>
                                                ) : (
                                                    <BreadcrumbLink
                                                        href={crumb.path}
                                                    >
                                                        {crumb.name}
                                                    </BreadcrumbLink>
                                                )}
                                            </BreadcrumbItem>
                                            {!isLast && <BreadcrumbSeparator />}
                                        </React.Fragment>
                                    );
                                })}
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </div>
                <Outlet />
            </main>
        </SidebarProvider>
    );
}

export default ProtectedLayout;
