import {
    GetObjectCommand,
    ListObjectsV2Command,
    S3Client,
} from "@aws-sdk/client-s3";
import { useKeycloak } from "@/context/keycloak-context.tsx";
import { DOMAIN_POSTFIX } from "@/lib/api-client.ts";
import { useS3Context } from "@/context/s3-context.tsx";

export const useS3Client = () => {
    const context = useS3Context();

    return context.credentials
        .then((credentials) => {
            return new S3Client({
                endpoint: `https://minio.${DOMAIN_POSTFIX}`,
                credentials: {
                    accessKeyId: credentials.accessKey,
                    secretAccessKey: credentials.secretKey,
                    sessionToken: credentials.sessionToken,
                },
                region: "us-east-1",
                forcePathStyle: true,
            });
        })
        .catch((error) => {
            console.error("Failed to initialize S3 client:", error);
            throw error;
        });
};

export const useS3Api = (projectId: string) => {
    const s3Client = useS3Client();
    const keycloak = useKeycloak();

    return {
        listObjects: () => {
            return s3Client
                .then((client) => {
                    const command = new ListObjectsV2Command({
                        Bucket: "images",
                        Prefix: `${keycloak.user?.profile.sub}/${projectId}/`,
                    });
                    const response = client.send(command);
                    return response.then(
                        (r) =>
                            r.Contents?.map((obj) => ({
                                name: obj.Key?.split("/").pop() || "",
                                etag: obj.ETag || "",
                                size: obj.Size || 0,
                                key: obj.Key,
                                lastModified: obj.LastModified || new Date(),
                            })) || [],
                    );
                })
                .catch((err) => {
                    console.error("Error listing objects:", err);
                    return [];
                });
        },
        getImageById: (
            id: string,
            resolution: "tiny" | "medium" | "original" = "tiny",
        ) => {
            return s3Client
                .then(async (client) => {
                    const key = `${keycloak.user?.profile.sub}/${projectId}/urn:uuid:${id}:resolution:${resolution}:sharpness:blurred`;
                    const command = new GetObjectCommand({
                        Bucket: "images",
                        Key: key,
                    });

                    const response = await client.send(command);

                    const reader = response.Body as ReadableStream<Uint8Array>;
                    const stream = reader.getReader();

                    const chunks: Uint8Array[] = [];

                    let done = false;
                    while (!done) {
                        const { value, done: doneReading } =
                            await stream.read();
                        if (value) chunks.push(value);
                        done = doneReading;
                    }

                    const blob = new Blob(chunks, {
                        type:
                            response.ContentType || "application/octet-stream",
                    });

                    return {
                        key: key,
                        blob,
                        contentType: response.ContentType,
                    };
                })
                .catch((err) => {
                    console.error("Error fetching object by URN:", err);
                    throw err;
                });
        },
    };
};
