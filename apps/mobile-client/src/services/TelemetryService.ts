export default class TelemetryService {
    public static async uploadTelemetry(
        bearer: string,
        projectId: string,
        telemetry: Telemetry,
    ) {
        const uploadResponse = await fetch(
            import.meta.env.VITE_UPLOAD_TELEMETRY_ENDPOINT,
            {
                method: "POST",
                body: JSON.stringify({ projectId, ...telemetry }),
                headers: {
                    Authorization: `Bearer ${bearer}`,
                    "Content-Type": "application/json",
                },
            },
        );

        if (uploadResponse.status !== 200) {
            throw Response;
        }
    }
}

type integer = number;

export interface Telemetry {
    name?: string; // Name of the device
    model: string; // Model name of the device
    isCharging?: boolean; // Does the device charge at the moment
    batteryLevel?: integer; // Current battery level in %
    memUsed?: integer; // Current memory usage of the app in MB
    uploadDuration: integer; // Upload time of last picture in ms
}
