import React, { createContext, ReactNode, useContext, useMemo } from "react";
import { Credentials, useApiClient } from "@/lib/api-client";
import { useParams } from "react-router-dom";

type S3ContextType = {
    credentials: Promise<Credentials>;
};

const S3Context = createContext<S3ContextType | null>(null);

const S3ContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const apiClient = useApiClient();
    const { projectId } = useParams();
    const credentials = useMemo(
        () => apiClient.getFileAccess(projectId),
        [projectId],
    );

    return (
        <S3Context.Provider
            value={{
                credentials: credentials,
            }}
        >
            {children}
        </S3Context.Provider>
    );
};

export function useS3Context(): S3ContextType {
    const context = useContext(S3Context);
    if (!context) {
        throw new Error("useProjects must be used within an ProjectProvider");
    }
    return context;
}

export default S3ContextProvider;
