package at.ac.tuwien.ase.ss25

import at.ac.tuwien.ase.ss25.dtos.ProjectDto
import at.ac.tuwien.ase.ss25.models.Project
import io.quarkus.funqy.Funq
import jakarta.inject.Inject
import jakarta.persistence.EntityManager
import jakarta.transaction.Transactional
import org.eclipse.microprofile.jwt.JsonWebToken
import java.util.*

class UpdateProjectFunction {

    @Inject
    lateinit var jwt: JsonWebToken

    @Inject
    lateinit var em: EntityManager

    @Funq
    @Transactional
    fun update(dto: ProjectDto) {
        var project: Project =
            em.createQuery("SELECT p FROM Project p WHERE p.userId=:sub AND p.extId=:id", Project::class.java)
                .setParameter("sub", UUID.fromString(jwt.subject))
                .setParameter("id", dto.id)
                .singleResult

        if (dto.name != null) {
            project.name = dto.name!!
        }
        if (dto.description != null) {
            project.description = dto.description
        }
        if (dto.start != null) {
            project.start = dto.start
        }
        if (dto.end != null) {
            project.end = dto.end
        }
        if (dto.captureStart != null) {
            project.captureStart = dto.captureStart
        }
        if (dto.captureEnd != null) {
            project.captureEnd = dto.captureEnd
        }
        em.merge(project)
    }
}
