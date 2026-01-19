import { Home, Plus, HammerIcon, LogOut, Loader2 } from "lucide-react";

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    // SidebarMenuAction
} from "@/components/ui/sidebar.tsx";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { useProtected } from "@/context/protected-context";
import { useProjects } from "@/context/project-context";
import Logo from "../assets/lime.png";

class MenuItem {
    constructor(
        public readonly title: string,
        public readonly url: string,
        public readonly icon: any,
    ) {}
}

// source: https://ui.shadcn.com/docs/components/sidebar
export function AppSidebar() {
    const { projects, isLoadingProjects } = useProjects();
    const { signOut } = useProtected();
    const [menuItems, setMenuItems] = useState([] as MenuItem[]);

    useEffect(() => {
        setMenuItems(
            projects?.map(
                (el) => new MenuItem(el.name, `/project/${el.id}`, HammerIcon),
            ) ?? [],
        );
    }, [projects]);

    return (
        <Sidebar>
            <SidebarHeader>
                <Link to="/dashboard">
                    <div className="text-3xl px-2 font-bold text-nowrap flex items-center">
                        <img src={Logo} alt="logo" className="h-[2rem] mr-2" />{" "}
                        LimeLapse
                    </div>
                </Link>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <Link to="/dashboard">
                                        <Home />
                                        <span>Home</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                    <SidebarGroupLabel>Your projects</SidebarGroupLabel>
                    <SidebarGroupContent>
                        {isLoadingProjects ? (
                            <SidebarMenu>
                                <SidebarMenuItem className="flex items-center py-1 animate-pulse">
                                    <div className="mx-2 size-6 rounded-full bg-gray-200"></div>
                                    <div className="h-2 rounded bg-gray-200 w-3/5"></div>
                                </SidebarMenuItem>
                                <SidebarMenuItem className="flex items-center py-1 animate-puls">
                                    <div className="mx-2 size-6 rounded-full bg-gray-200"></div>
                                    <div className="h-2 rounded bg-gray-200 w-4/5"></div>
                                </SidebarMenuItem>
                                <SidebarMenuItem className="flex items-center py-1 animate-puls">
                                    <div className="mx-2 size-6 rounded-full bg-gray-200"></div>
                                    <div className="h-2 rounded bg-gray-200 w-2/5"></div>
                                </SidebarMenuItem>
                                <SidebarMenuItem
                                    key="loading-spinner"
                                    className="flex items-center"
                                >
                                    <Loader2 className="mx-2 animate-spin" />
                                    <span>Loading ...</span>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        ) : (
                            <SidebarMenu>
                                {menuItems.map((menuItem) => (
                                    <SidebarMenuItem key={menuItem.title}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={
                                                menuItem.title === "Settings"
                                            }
                                        >
                                            <Link to={menuItem.url}>
                                                <menuItem.icon />
                                                <span>{menuItem.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                                {isLoadingProjects && (
                                    <SidebarMenuItem key="loading spinner">
                                        <Loader2 className="animate-spin" />
                                    </SidebarMenuItem>
                                )}
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild>
                                        <Link to="/create-project">
                                            <Plus />
                                            <span>Create new project</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        )}
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <Button
                    variant="ghost"
                    size="lg"
                    className="justify-start !pl-2"
                    onClick={() => signOut()}
                >
                    <LogOut className="text-red-500" />
                    <span className="font-semi-bold">Log out</span>
                </Button>
            </SidebarFooter>
        </Sidebar>
    );
}
