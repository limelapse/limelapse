package at.ac.tuwien.ase.ss25

import io.minio.GetObjectArgs
import io.minio.MinioClient
import io.minio.PutObjectArgs
import io.quarkus.funqy.Funq
import io.quarkus.funqy.knative.events.CloudEventMapping
import jakarta.inject.Inject
import org.eclipse.microprofile.config.inject.ConfigProperty
import org.slf4j.LoggerFactory
import java.awt.Image
import java.awt.image.BufferedImage
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import javax.imageio.ImageIO

class ImageProcessingFunction {
    private val logger = LoggerFactory.getLogger(ImageProcessingFunction::class.java)

    @Inject
    lateinit var client: MinioClient

    @ConfigProperty(name = "MINIO_IMAGES_BUCKET", defaultValue = "images")
    lateinit var defaultBucket: String

    enum class ImageResolution(val width: Int, val height: Int, val tag: String) {
        MEDIUM(1920, 1080, "medium"),
        SMALL(1280, 720, "small"),
        TINY(854, 480, "tiny");

        companion object {
            fun fromTag(tag: String): ImageResolution? =
                values().find { it.tag == tag.lowercase() }
        }
    }

    /**
     * Event-driven image processing triggered by upload event
     */
    @Funq
    @CloudEventMapping(trigger = "MinioUpload")
    fun onUpload(upload: MinioUpload) {
        val bucketName = upload.bucket
        val objectPath = upload.path

        if (bucketName.isEmpty() || objectPath.isEmpty()) {
            logger.warn("Faulty event representation $upload")
            return
        }

        if (!objectPath.isBlurredOriginal()) {
            logger.info("Filtering unwanted upload event $bucketName $objectPath")
            return
        }

        processImage(bucketName, objectPath)
    }

    /**
     * Manual image processing endpoint
     */
    @Funq
    fun resize(imagePath: String): Map<String, Any> {
        return processImage(defaultBucket, imagePath)
    }

    /**
     * Process image from an event or manual resize
     */
    private fun processImage(bucketName: String, objectPath: String): Map<String, Any> {
        try {
            val inputStream = client.getObject(
                GetObjectArgs.builder()
                    .bucket(bucketName)
                    .`object`(objectPath)
                    .build()
            )

            val originalImage = ImageIO.read(inputStream)

            // Create result map to store processed image names
            val result = mutableMapOf<String, String>()
            result["original"] = objectPath

            // Process each resolution
            for (resolution in ImageResolution.entries) {
                val resizedImage = resizeImage(
                    originalImage,
                    resolution.width,
                    resolution.height
                )

                val byteArrayOutputStream = ByteArrayOutputStream()
                ImageIO.write(resizedImage, "jpg", byteArrayOutputStream)
                val byteArrayInputStream = ByteArrayInputStream(byteArrayOutputStream.toByteArray())

                val resizedObjectName = objectPath.replace(":resolution:original", ":resolution:${resolution.tag}")

                client.putObject(
                    PutObjectArgs.builder()
                        .bucket(bucketName)
                        .`object`(resizedObjectName)
                        .stream(byteArrayInputStream, byteArrayInputStream.available().toLong(), -1)
                        .contentType("image/jpg")
                        .build()
                )

                result[resolution.tag] = resizedObjectName
            }

            return result
        } catch (e: Exception) {
            logger.error("Error processing image", e)
            return emptyMap()
        }
    }

    /**
     * Resize image maintaining aspect ratio
     */
    private fun resizeImage(originalImage: BufferedImage, targetWidth: Int, targetHeight: Int): BufferedImage {
        val scaledImage = originalImage.getScaledInstance(targetWidth, targetHeight, Image.SCALE_SMOOTH)

        val resizedImage = BufferedImage(targetWidth, targetHeight, BufferedImage.TYPE_INT_RGB)
        val graphics = resizedImage.createGraphics()
        graphics.drawImage(scaledImage, 0, 0, null)
        graphics.dispose()

        return resizedImage
    }

    private fun String.isBlurredOriginal(): Boolean {
        return contains(":resolution:original") && contains(":sharpness:blurred")
    }
}

data class MinioUpload(
    val bucket: String = "",
    val path: String = "",
)