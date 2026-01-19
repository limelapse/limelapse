import React from "react";
import { useKeycloak } from "@/context/keycloak-context";
import { Button } from "@/components/ui/button";
import backgroundImage from "@/assets/login-screen.jpg";
import { ArrowRight, Target, Sparkles } from "lucide-react";

const WelcomePage: React.FC = () => {
    const keycloak = useKeycloak();

    return (
        <div className="flex h-full">
            <div className="w-full p-20 flex items-center justify-center">
                <div className="max-w-150">
                    <h1 className="scroll-m-20 font-extrabold tracking-tight text-3xl lg:text-4xl">
                        Welcome to LimeLapse!
                    </h1>
                    <p className="pt-2 text-muted-foreground">
                        LimeLapse is your Timelapse-as-a-Service platform —
                        bringing new purpose to your old smartphone by turning
                        it into a smart timelapse camera.
                    </p>
                    <p className="pt-4 text-muted-foreground">
                        Whether you're documenting a construction site or
                        building brand stories — LimeLapse helps you see change
                        in motion.
                    </p>
                    <Button
                        className="mt-8"
                        onClick={() => {
                            keycloak.signInWithRedirect("/dashboard");
                        }}
                    >
                        Start now for free <ArrowRight />
                    </Button>

                    <div className="mt-12 space-y-8">
                        {/* Stakeholders Section */}
                        <div className="p-6 rounded-2xl shadow-md border border-muted bg-muted/20">
                            <div className="flex items-center mb-4">
                                <Target className="text-lime-600 mr-2" />
                                <h2 className="text-xl font-bold text-lime-800">
                                    Who it's for
                                </h2>
                            </div>
                            <ul className="space-y-2 text-muted-foreground pl-1">
                                <li>
                                    📸 Marketing teams capturing compelling
                                    progress stories
                                </li>
                                <li>
                                    🏗️ House builders documenting each stage of
                                    construction
                                </li>
                                <li>
                                    📐 Architects visualizing and presenting
                                    their creative journey
                                </li>
                            </ul>
                        </div>

                        {/* Features Section */}
                        <div className="p-6 rounded-2xl shadow-md border border-muted bg-muted/20">
                            <div className="flex items-center mb-4">
                                <Sparkles className="text-lime-600 mr-2" />
                                <h2 className="text-xl font-bold text-lime-800">
                                    Key Features
                                </h2>
                            </div>
                            <ul className="space-y-2 text-muted-foreground pl-1">
                                <li>
                                    🔍{" "}
                                    <span className="font-medium text-foreground">
                                        AI-powered search:
                                    </span>{" "}
                                    Instantly find any moment in your timeline
                                </li>
                                <li>
                                    🔐{" "}
                                    <span className="font-medium text-foreground">
                                        Privacy-first:
                                    </span>{" "}
                                    You control your data at every step
                                </li>
                                <li>
                                    ⚡{" "}
                                    <span className="font-medium text-foreground">
                                        Instant timelapse magic:
                                    </span>{" "}
                                    No setup hassle, just results
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            <div
                className="brightness-50 w-full h-full bg-cover bg-center"
                style={{ backgroundImage: `url(${backgroundImage})` }}
            />
        </div>
    );
};

export default WelcomePage;
