import React, { useRef, useState } from "react";
import { SearchComponent } from "@/components/project-page/SearchComponent.tsx";
import DownloadCenter from "@/components/project-page/DownloadCenter.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useParams } from "react-router-dom";
import PlanningSection from "@/components/project-page/planning-section/PlanningSection.tsx";
import { PreviewComponent } from "@/components/project-page/PreviewComponent.tsx";

const ProjectMediaPanel: React.FC = () => {
    const { projectId } = useParams();
    const [, setDisplayImage] = useState<string>("");
    const previewRef = useRef<string | null>(null);
    return (
        <div id="ProjectMediaEditor" className="flex p-4 pl-0 justify-between">
            <div className="w-3/5">
                <Tabs defaultValue="planning">
                    <TabsList className="rounded">
                        <TabsTrigger value="planning" className="rounded">
                            Planning
                        </TabsTrigger>
                        <TabsTrigger value="preview" className="rounded">
                            Preview
                        </TabsTrigger>
                        <TabsTrigger value="download" className="rounded">
                            Download
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent className="py-2" value="planning">
                        <PlanningSection />

                        {/*TODO
                        <PlanningHeatmap />*/}
                    </TabsContent>
                    <TabsContent className="py-2" value="preview">
                        <PreviewComponent
                            projectId={projectId ?? ""}
                            ref={previewRef}
                        />
                    </TabsContent>
                    <TabsContent className="py-2" value="download">
                        <DownloadCenter />
                    </TabsContent>
                </Tabs>
            </div>
            <SearchComponent
                projectId={projectId ?? ""}
                imageSelected={setDisplayImage}
            />
        </div>
    );
};

export default ProjectMediaPanel;
