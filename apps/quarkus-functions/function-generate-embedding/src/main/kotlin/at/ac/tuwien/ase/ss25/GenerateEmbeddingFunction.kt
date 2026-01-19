package at.ac.tuwien.ase.ss25

import at.ac.tuwien.ase.ss25.models.PictureEmbedding
import at.ac.tuwien.ase.ss25.models.Project
import io.minio.GetPresignedObjectUrlArgs
import io.minio.MinioClient
import io.minio.http.Method
import io.quarkus.funqy.Funq
import io.quarkus.funqy.knative.events.CloudEventMapping
import jakarta.persistence.EntityManager
import jakarta.transaction.TransactionManager
import org.eclipse.microprofile.config.inject.ConfigProperty
import org.slf4j.LoggerFactory
import java.util.UUID
import java.util.concurrent.TimeUnit
import java.time.Instant

class GenerateEmbeddingFunction(
    private val minioClient: MinioClient,
    private val embeddingClient: GenerateEmbeddingApiClient,
    private val entityManager: EntityManager,
    private val transactionManager: TransactionManager
) {

    private val logger = LoggerFactory.getLogger(this::class.java)

    @ConfigProperty(name = "MINIO_IMAGES_BUCKET", defaultValue = "images")
    lateinit var bucket: String

    @Funq
    @CloudEventMapping(trigger = "MinioUpload")
    fun generateEmbedding(payload: MinioUpload) {
        logger.info("${payload.bucket} ${payload.path}");
        val bucketName = payload.bucket
        val objectPath = payload.path

        if (bucketName.isEmpty() || objectPath.isEmpty()) {
            logger.warn("faulty event representation $payload")
            return
        }

        if (bucketName != bucket || !objectPath.isBlurredOriginal()) {
            logger.info("filter unwanted upload event $bucketName $objectPath")
            return
        }

        val projectId = UUID.fromString(objectPath.substringAfter("/").substringBefore("/"))
        val projectEntity = entityManager.createQuery("""
            SELECT p FROM Project p where p.extId = :projectId
        """.trimIndent(),
            Project::class.java
        ).setParameter("projectId", projectId)
            .singleResult

        if (projectEntity == null) {
            logger.info("filter unwanted upload event $bucketName $objectPath project does not exist")
            return
        }

        val embeddingResponse = embeddingClient.generateEmbedding(
            EmbeddingRequest(
                url = presignedDownloadUrl(bucketName, objectPath),
            )
        )

        val fileUUID = objectPath.substringAfter(":uuid:").substringBefore(":")

        transactionManager.begin()
        entityManager.merge(
            PictureEmbedding().also {
                it.pictureUUID = UUID.fromString(fileUUID)
                it.projectId = projectEntity.id
                it.embedding = embeddingResponse.embedding
                it.extractedTimestamp = Instant.ofEpochMilli(extractTimestampFromUUIDv7(it.pictureUUID))
            }
        )
        transactionManager.commit()
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

    private fun String.isBlurredOriginal(): Boolean {
        return contains(":resolution:original") && contains(":sharpness:blurred")
    }
}

data class MinioUpload(
    val bucket: String = "",
    val path: String = "",
)