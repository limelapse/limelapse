package at.ac.tuwien.ase.ss25

import at.ac.tuwien.ase.ss25.models.Project
import at.ac.tuwien.ase.ss25.service.TimelapseExportService
import jakarta.inject.Inject
import jakarta.persistence.EntityManager
import jakarta.transaction.Transactional
import jakarta.ws.rs.Consumes
import jakarta.ws.rs.POST
import jakarta.ws.rs.Path
import jakarta.ws.rs.Produces
import jakarta.ws.rs.core.MediaType
import jakarta.ws.rs.core.Response
import org.eclipse.microprofile.config.inject.ConfigProperty
import org.eclipse.microprofile.jwt.JsonWebToken
import org.eclipse.microprofile.rest.client.inject.RestClient
import java.util.*
import java.util.stream.Collectors

@Path("/generate")
class GeneratePreviewFunction {

    @Inject
    lateinit var jwt: JsonWebToken

    @Inject
    lateinit var em: EntityManager

    @ConfigProperty(name = "MINIO_IMAGES_BUCKET")
    lateinit var imageBucket: String

    @Inject
    @RestClient
    lateinit var exportService: TimelapseExportService

    /**
     * This is not really a funqy function, out of necessity to change the content type
     */
    @POST
    @Produces("video/mp4")
    @Consumes(MediaType.APPLICATION_JSON)
    @Transactional
    fun generate(dto: ProcessDto): Response? {
        val userId = UUID.fromString(jwt.subject)
        val project: Project =
            em.createQuery("SELECT p FROM Project p WHERE userId=:user_id AND extId=:id", Project::class.java)
                .setParameter("user_id", userId)
                .setParameter("id", dto.projectId)
                .singleResult // throws exception if project does not exist

        val video = exportService.processSync(
            imageBucket,
            dto.duration,
            dto.images?.stream()?.map { "${userId}/${dto.projectId}/${it}" }?.collect(Collectors.joining("\n"))!!
        ).toCompletableFuture().get()
        return Response.ok(video)
            .header("Content-Disposition", "attachment; filename=\"preview.mp4\"")
            .header("Content-Type", "video/mp4")
            .build()
    }
}

data class ProcessDto(
    var projectId: UUID?,
    var images: List<String>?, //equidistant in the timelapse
    var duration: Long //Timespan to preview in ms
) {
    constructor(): this( null, null, 0)
}