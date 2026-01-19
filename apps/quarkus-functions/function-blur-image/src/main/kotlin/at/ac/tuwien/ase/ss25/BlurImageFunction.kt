package at.ac.tuwien.ase.ss25

import io.minio.GetPresignedObjectUrlArgs
import io.minio.MinioClient
import io.minio.http.Method
import io.quarkus.funqy.Funq
import io.quarkus.funqy.knative.events.CloudEventMapping
import org.eclipse.microprofile.config.inject.ConfigProperty
import org.slf4j.LoggerFactory
import java.util.concurrent.TimeUnit

class BlurImageFunction(
    private val minioClient: MinioClient,
    private val blurImageApiClient: BlurImageApiClient
) {

    private val logger = LoggerFactory.getLogger(BlurImageFunction::class.java)

    @ConfigProperty(name = "MINIO_IMAGES_BUCKET")
    lateinit var bucket: String

    @Funq
    @CloudEventMapping(trigger = "MinioUpload")
    fun blurImage(payload: MinioUpload) {
        logger.info("${payload.bucket} ${payload.path}");
        val bucketName = payload.bucket
        val objectPath = payload.path

        if (bucketName.isEmpty() || objectPath.isEmpty()) {
            logger.warn("faulty event representation $payload")
            return
        }

        if (bucketName != bucket || !objectPath.contains(":sharpness:sharp")) {
            logger.info("filter unwanted upload event $bucketName $objectPath")
            return
        }

        blurImageApiClient.blurImage(
            BlurImageRequest(
                url = presignedDownloadUrl(bucketName, objectPath),
                uploadUrl = presignedUploadUrl(bucketName, objectPath)
            )
        )
    }

    private fun presignedDownloadUrl(bucket: String, path: String): String = minioClient.getPresignedObjectUrl(
        GetPresignedObjectUrlArgs
            .builder()
            .bucket(bucket)
            .`object`(path)
            .method(Method.GET)
            .expiry(1, TimeUnit.HOURS)
            .build()
    )

    private fun presignedUploadUrl(bucket: String, path: String): String = minioClient.getPresignedObjectUrl(
        GetPresignedObjectUrlArgs
            .builder()
            .bucket(bucket)
            .`object`(path.replace(":sharpness:sharp", ":sharpness:blurred"))
            .method(Method.PUT)
            .expiry(1, TimeUnit.HOURS)
            .build()
    )

}

data class MinioUpload(
    val bucket: String = "",
    val path: String = "",
)