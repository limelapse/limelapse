package at.ac.tuwien.ase.ss25

import at.ac.tuwien.ase.ss25.models.Project
import at.ac.tuwien.ase.ss25.models.Video
import at.ac.tuwien.ase.ss25.models.VideoState
import com.fasterxml.uuid.Generators
import io.quarkus.funqy.Funq
import io.vertx.core.Vertx
import io.vertx.ext.web.client.WebClient
import jakarta.inject.Inject
import jakarta.persistence.EntityManager
import jakarta.transaction.Transactional
import org.eclipse.microprofile.config.inject.ConfigProperty
import org.eclipse.microprofile.jwt.JsonWebToken
import java.util.*

class GenerateVideoFunction(
    private val vertx: Vertx
) {

    @Inject
    lateinit var jwt: JsonWebToken

    @Inject
    lateinit var em: EntityManager

    @ConfigProperty(name = "broker.url")
    lateinit var brokerUrl: String

    @Funq
    @Transactional
    fun generate(dto: GenerateVideoDto): UUID {
        val project: Project =
            em.createQuery("SELECT p FROM Project p WHERE userId=:user_id AND extId=:id", Project::class.java)
                .setParameter("user_id", UUID.fromString(jwt.subject))
                .setParameter("id", dto.projectId)
                .singleResult // throws exception if project does not exist

        val uuid = Generators.timeBasedEpochGenerator().generate() // timestamp based version 7 UUID

        val video = Video(
            extId = uuid,
            userId = UUID.fromString(jwt.subject),
            status = VideoState.QUEUED,
            projectId = project.extId
        )
        em.persist(video)

        WebClient.create(vertx)
            .postAbs(brokerUrl)
            .putHeader("Ce-Id", UUID.randomUUID().toString())
            .putHeader("Ce-Specversion", "1.0")
            .putHeader("Ce-Type", "GenerateVideo")
            .putHeader("Ce-Source", "GenerateVideoFunction")
            .sendJson(
                mapOf(
                    "extId" to uuid,
                    "projectId" to project.extId,
                    "userId" to project.userId,
                    "images" to dto.images
                )
            ).result()

        return uuid
    }
}

data class GenerateVideoDto(
    var projectId: UUID?,
    var images: List<String>?
) {
    constructor() : this(null, null)
}
