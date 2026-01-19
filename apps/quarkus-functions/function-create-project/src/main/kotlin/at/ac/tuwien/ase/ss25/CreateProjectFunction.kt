package at.ac.tuwien.ase.ss25

import at.ac.tuwien.ase.ss25.dtos.ProjectDto
import at.ac.tuwien.ase.ss25.models.toProject
import io.quarkus.funqy.Funq
import jakarta.inject.Inject
import jakarta.persistence.EntityManager
import jakarta.transaction.Transactional
import org.eclipse.microprofile.jwt.JsonWebToken
import java.util.*

class CreateProjectFunction {

    @Inject
    lateinit var jwt: JsonWebToken

    @Inject
    lateinit var em: EntityManager

    @Funq
    @Transactional
    fun create(dto: ProjectDto): UUID {
        val project = dto.toProject()
        project.userId = UUID.fromString(jwt.subject)
        em.persist(project)
        return project.extId
    }
}
