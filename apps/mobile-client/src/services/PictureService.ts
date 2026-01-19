export default class PictureService {
    public static async uploadPicture(
        bearer: string,
        projectId: string,
        image: string,
    ) {
        // 1) Get pre-signed URL
        const response = await fetch(
            import.meta.env.VITE_UPLOAD_PICTURE_ENDPOINT,
            {
                method: "POST",
                body: JSON.stringify({ projectId }),
                headers: {
                    Authorization: `Bearer ${bearer}`,
                    "Content-Type": "application/json",
                },
            },
        );
        if (response.status !== 200) {
            throw response;
        }
        const uploadUrl: string = await response.json();

        // 2) Upload image
        const byteCharacters = atob(image);
        const byteArrays = [];

        for (let offset = 0; offset < byteCharacters.length; offset += 512) {
            const slice = byteCharacters.slice(offset, offset + 512);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }

        const blob = new Blob(byteArrays, {
            type: "image/jpeg",
        });

        const uploadResponse = await fetch(uploadUrl, {
            method: "PUT",
            body: blob,
            headers: {
                "Content-Type": "image/jpeg",
            },
        });

        if (uploadResponse.status !== 200) {
            throw response;
        }
    }
}
