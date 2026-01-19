import { Routes, Route } from "react-router-dom";
import WelcomePage from "./pages/WelcomePage";
import ProtectedProvider from "./context/protected-context";
import KeycloakProvider from "./context/keycloak-context";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import "./App.css";
import { CreateProjectPage } from "@/pages/CreateProjectPage.tsx";
import ProjectPage from "@/pages/ProjectPage.tsx";
import ProtectedLayout from "./components/ProtectedLayout";
import ProjectProvider from "./context/project-context";
import S3ContextProvider from "@/context/s3-context.tsx";

export default function App() {
    return (
        <KeycloakProvider>
            <Routes>
                <Route path="/" element={<WelcomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route element={<ProtectedProvider />}>
                    <Route element={<ProjectProvider />}>
                        <Route element={<ProtectedLayout />}>
                            <Route
                                path="/dashboard"
                                element={<DashboardPage />}
                            />
                            <Route
                                path="/project/:projectId"
                                element={
                                    <S3ContextProvider>
                                        <ProjectPage />
                                    </S3ContextProvider>
                                }
                            />
                            <Route
                                path="/create-project"
                                element={<CreateProjectPage />}
                            />
                        </Route>
                    </Route>
                </Route>
            </Routes>
        </KeycloakProvider>
    );
}
