package at.ac.tuwien.ase.ss25

import at.ac.tuwien.ase.ss25.models.Video
import at.ac.tuwien.ase.ss25.models.VideoState
import at.ac.tuwien.ase.ss25.service.TimelapseExportService
import io.quarkus.funqy.Funq
import io.quarkus.funqy.knative.events.CloudEventMapping
import jakarta.inject.Inject
import jakarta.persistence.EntityManager
import jakarta.transaction.Transactional
import org.eclipse.microprofile.config.inject.ConfigProperty
import org.eclipse.microprofile.rest.client.inject.RestClient
import java.util.*
import java.util.stream.Collectors

class ProcessVideoFunction {

    @Inject
    lateinit var em: EntityManager

    @ConfigProperty(name = "MINIO_IMAGES_BUCKET")
    lateinit var imageBucket: String

    @ConfigProperty(name = "MINIO_VIDEOS_BUCKET")
    lateinit var videosBucket: String

    @RestClient
    lateinit var exportService: TimelapseExportService

    @Funq
    @CloudEventMapping(trigger = "GenerateVideo")
    @Transactional
    fun process(dto: ProcessDto) {
        val video: Video = em.createQuery("SELECT v FROM Video v WHERE userId=:userId AND extId=:extId", Video::class.java)
            .setParameter("userId", dto.userId)
            .setParameter("extId", dto.extId)
            .singleResult

        if (VideoState.QUEUED != video.status) {
            return
        }

        exportService.processAsync(
            imageBucket,
            videosBucket,
            "${dto.userId}/${dto.projectId}/${dto.extId}",
            dto.images?.stream()?.map { "${dto.userId}/${dto.projectId}/${it}" }?.collect(Collectors.joining("\n"))!!,
        )

        video.status = VideoState.PROCESSING
        em.merge(video)
    }
}

data class ProcessDto(
    var extId: UUID?,
    var projectId: UUID?,
    var userId: UUID?,
    var images: List<String>?,
) {
    constructor(): this(null, null, null, null)
}