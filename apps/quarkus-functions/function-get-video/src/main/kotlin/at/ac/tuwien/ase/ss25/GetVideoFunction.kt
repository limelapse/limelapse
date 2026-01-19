package at.ac.tuwien.ase.ss25

import at.ac.tuwien.ase.ss25.models.Project
import at.ac.tuwien.ase.ss25.models.Video
import at.ac.tuwien.ase.ss25.models.VideoState
import io.minio.GetPresignedObjectUrlArgs
import io.minio.MinioClient
import io.minio.http.Method
import io.quarkus.funqy.Funq
import jakarta.annotation.security.RolesAllowed
import jakarta.inject.Inject
import jakarta.persistence.EntityManager
import org.eclipse.microprofile.config.inject.ConfigProperty
import org.eclipse.microprofile.jwt.JsonWebToken
import java.util.*
import java.util.concurrent.TimeUnit

class GetVideoFunction {

    @Inject
    lateinit var jwt: JsonWebToken

    @Inject
    lateinit var client: MinioClient

    @ConfigProperty(name = "MINIO_VIDEOS_BUCKET")
    lateinit var bucket: String

    @ConfigProperty(name = "LIMELAPSE_MINIO_INGRESS_URL", defaultValue = "https://download.limelapse.com")
    lateinit var minioIngressUrl: String

    @ConfigProperty(name = "LIMELAPSE_MINIO_SERVICE_URL", defaultValue = "http://minio:9000")
    lateinit var minioServiceUrl: String

    @Inject
    lateinit var em: EntityManager

    @Funq
    @RolesAllowed("user")
    fun get(dto: GetVideoDto): String {
        val project: Project =
            em.createQuery("SELECT p FROM Project p WHERE userId=:user_id AND extId=:id", Project::class.java)
                .setParameter("user_id", UUID.fromString(jwt.subject))
                .setParameter("id", dto.projectId)
                .singleResult // throws exception if project does not exist


        val video: Video =
            em.createQuery("SELECT v FROM Video v WHERE userId=:userId AND extId=:extId", Video::class.java)
                .setParameter("userId", UUID.fromString(jwt.subject))
                .setParameter("extId", dto.videoId)
                .singleResult

        if (VideoState.FINISHED != video.status) {
            throw RuntimeException("Video is not finished yet")
        }

        // get presigned url form minio
        return client.getPresignedObjectUrl(
            GetPresignedObjectUrlArgs
                .builder()
                .bucket(bucket)
                .`object`("${jwt.subject}/${project.extId}/${dto.videoId}")
                .method(Method.GET)
                .expiry(1, TimeUnit.HOURS)
                .build()
        ).replaceFirst(minioServiceUrl, minioIngressUrl)
    }
}

data class GetVideoDto(
    var projectId: UUID?,
    var videoId: UUID?
) {
    constructor() : this(null, null)
}
