package at.ac.tuwien.ase.ss25

import at.ac.tuwien.ase.ss25.models.Project
import at.ac.tuwien.ase.ss25.models.Video
import at.ac.tuwien.ase.ss25.models.VideoState
import io.minio.MinioClient
import io.minio.RemoveObjectArgs
import io.quarkus.funqy.Funq
import jakarta.annotation.security.RolesAllowed
import jakarta.inject.Inject
import jakarta.persistence.EntityManager
import jakarta.transaction.Transactional
import org.eclipse.microprofile.config.inject.ConfigProperty
import org.eclipse.microprofile.jwt.JsonWebToken
import java.util.*

class DeleteVideoFunction {

    @Inject
    lateinit var jwt: JsonWebToken

    @Inject
    lateinit var client: MinioClient

    @ConfigProperty(name = "MINIO_VIDEOS_BUCKET")
    lateinit var bucket: String

    @Inject
    lateinit var em: EntityManager

    @Funq
    @RolesAllowed("user")
    @Transactional
    fun delete(dto: DeleteVideoDto)  {
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

        client.removeObject(
            RemoveObjectArgs.builder()
                .bucket(bucket)
                .`object`("${jwt.subject}/${project.extId}/${video.extId}")
                .build()
        )

        em.remove(video)
    }
}

data class DeleteVideoDto(
    var projectId: UUID?,
    var videoId: UUID?
) {
    constructor() : this(null, null)
}
