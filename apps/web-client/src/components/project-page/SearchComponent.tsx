import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input.tsx";
import { useDebounce } from "@/lib/utils.ts";
import {
    SearchHeatmapResults,
    SearchResults,
    useApiClient,
} from "@/lib/api-client.ts";
import { PictureComponent } from "@/components/project-page/PictureComponent.tsx";
import HeatmapSlider from "@/components/project-page/HeatmapSliderComponent.tsx";
import { useProjects } from "@/context/project-context.tsx";

interface SearchProps {
    projectId: string;
    imageSelected?: (id: string) => void;
}

interface DateRange {
    from: Date | undefined;
    to?: Date | undefined;
}

export const SearchComponent: React.FC<SearchProps> = React.memo(
    ({ projectId, imageSelected }) => {
        const [query, setQuery] = useState("");
        const [result, setResult] = useState<SearchResults>({
            hits: [],
            totalResults: 0,
        });
        const [heatmap, setHeatmap] = useState<SearchHeatmapResults>({
            heatmap: [],
            start: new Date().getTime(),
            end: new Date().getTime(),
        });

        const apiClient = useApiClient();

        const IMAGES_PER_PAGE = 16;
        const [currentPage, setCurrentPage] = useState(1);
        const [totalPages, setTotalPages] = useState(1);
        const [dateRange, setDateRange] = useState<DateRange>({
            from: undefined,
            to: undefined,
        });

        const fetch = async (query: string) => {
            fetchImages(query);
            fetchHeatmap(query);
        };

        const fetchImages = async (query: string) => {
            const results = await apiClient.search({
                projectId: projectId!,
                query: query,
                page: currentPage - 1,
                size: IMAGES_PER_PAGE,
                timeEnd: dateRange.to?.getTime(),
                timeStart: dateRange.from?.getTime(),
            });
            setTotalPages(Math.ceil(results.totalResults / IMAGES_PER_PAGE));
            setResult(results);
            setCurrentPageOfSearchResults(results);
        };

        const fetchHeatmap = async (query: string) => {
            const heatmap = await apiClient.searchHeatmap({
                projectId: projectId!,
                query: query,
            });
            setHeatmap(heatmap);
        };

        const debouncedFetch = useDebounce(fetch, 500);
        const debouncedFetchImages = useDebounce(fetchImages, 500);
        const { setCurrentPageOfSearchResults } = useProjects();

        // Call debounced fetch on query
        useEffect(() => {
            debouncedFetch(query);
        }, [query]);

        // Fetch only images on date range change
        useEffect(() => {
            debouncedFetchImages(query);
        }, [dateRange]);

        // Fetch on page change immediately
        useEffect(() => {
            fetch(query);
        }, [currentPage]);

        const slideIndexRef = useRef(0);

        useEffect(() => {
            if (!result?.hits?.length) return;

            const tick = () => {
                slideIndexRef.current =
                    (slideIndexRef.current + 1) % result.hits.length;

                const currentImage =
                    result.hits[slideIndexRef.current]?.imageId;
                if (imageSelected && currentImage) {
                    imageSelected(currentImage);
                }
            };

            const interval = setInterval(tick, 3000);
            return () => clearInterval(interval);
        }, [result?.hits, imageSelected]);

        const handleRangeChange = (from: Date, to: Date) => {
            setDateRange({ from: from, to: to });
        };

        // set date range of images after heatmap is fetched
        useEffect(() => {
            setDateRange({
                from: new Date(heatmap.start),
                to: new Date(heatmap.end),
            });
        }, [heatmap.start, heatmap.end]);

        return (
            <div className="w-2/5 ml-12 space-y-4">
                <Input
                    type="text"
                    placeholder="Search images..."
                    className="border p-2"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                <HeatmapSlider
                    values={heatmap.heatmap}
                    start={new Date(heatmap.start)}
                    end={new Date(heatmap.end)}
                    onRangeChange={handleRangeChange}
                />
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 ml-auto border-2 p-2">
                    {result.hits.map((el) => (
                        <PictureComponent
                            key={el.imageId}
                            imageId={el.imageId}
                            projectId={projectId}
                            selectable={true}
                        />
                    ))}
                </div>
                <div className="flex justify-center items-center space-x-4 pt-4">
                    <button
                        className="px-4 py-2 border rounded disabled:opacity-50"
                        onClick={() =>
                            setCurrentPage((p) => Math.max(p - 1, 1))
                        }
                        disabled={currentPage <= 1}
                    >
                        Previous
                    </button>
                    <span>
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        className="px-4 py-2 border rounded disabled:opacity-50"
                        onClick={() =>
                            setCurrentPage((p) => Math.min(p + 1, totalPages))
                        }
                        disabled={currentPage >= totalPages}
                    >
                        Next
                    </button>
                </div>
            </div>
        );
    },
);
