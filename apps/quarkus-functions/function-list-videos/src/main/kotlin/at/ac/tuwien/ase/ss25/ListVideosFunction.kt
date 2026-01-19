package at.ac.tuwien.ase.ss25

import at.ac.tuwien.ase.ss25.dtos.VideoDto
import at.ac.tuwien.ase.ss25.dtos.toDto
import at.ac.tuwien.ase.ss25.models.Project
import at.ac.tuwien.ase.ss25.models.Video
import io.quarkus.funqy.Funq
import jakarta.annotation.security.RolesAllowed
import jakarta.inject.Inject
import jakarta.persistence.EntityManager
import org.eclipse.microprofile.jwt.JsonWebToken
import java.util.*

class ListVideosFunction {

    @Inject
    lateinit var jwt: JsonWebToken

    @Inject
    lateinit var em: EntityManager

    @Funq
    @RolesAllowed("user")
    fun list(projectId: UUID): List<VideoDto> {
        val project: Project =
            em.createQuery("SELECT p FROM Project p WHERE userId=:user_id AND extId=:id", Project::class.java)
                .setParameter("user_id", UUID.fromString(jwt.subject))
                .setParameter("id", projectId)
                .singleResult // throws exception if project does not exist

        val videos: List<Video> =
            em.createQuery("SELECT v FROM Video v WHERE userId=:userId and projectId=:id", Video::class.java)
                .setParameter("userId", UUID.fromString(jwt.subject))
                .setParameter("id", projectId)
                .resultList

        return videos.stream().map { video -> video.toDto() }.toList()
    }
}