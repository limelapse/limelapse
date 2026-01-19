package at.ac.tuwien.ase.ss25

import at.ac.tuwien.ase.ss25.models.Video
import at.ac.tuwien.ase.ss25.models.VideoState
import io.quarkus.funqy.Funq
import io.quarkus.funqy.knative.events.CloudEventMapping
import jakarta.inject.Inject
import jakarta.persistence.EntityManager
import jakarta.transaction.Transactional
import org.eclipse.microprofile.config.inject.ConfigProperty
import java.time.OffsetDateTime
import java.util.*

class FinishVideoFunction {

    @Inject
    lateinit var em: EntityManager

    @ConfigProperty(name = "MINIO_VIDEOS_BUCKET")
    lateinit var bucket: String

    @Funq
    @CloudEventMapping(trigger = "MinioUpload")
    @Transactional
    fun finish(dto: MinioUpload) {
        if (dto.bucket != bucket) {
            return
        }
        val split = dto.path.split("/")
        val userId = UUID.fromString(split[0])
        val videoId = UUID.fromString(split[2])
        val video: Video = em.createQuery("SELECT v FROM Video v WHERE userId=:userId AND extId=:extId", Video::class.java)
            .setParameter("userId", userId)
            .setParameter("extId", videoId)
            .singleResult
        video.status = VideoState.FINISHED
        video.createdAt = OffsetDateTime.now()
        em.merge(video)
    }
}

data class MinioUpload(
    val bucket: String = "",
    val path: String = "",
)
