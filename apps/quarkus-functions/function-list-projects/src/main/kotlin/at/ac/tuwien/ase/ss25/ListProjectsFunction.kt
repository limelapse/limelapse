package at.ac.tuwien.ase.ss25

import at.ac.tuwien.ase.ss25.dtos.ProjectDto
import at.ac.tuwien.ase.ss25.dtos.toDto
import at.ac.tuwien.ase.ss25.models.Project
import io.quarkus.funqy.Funq
import jakarta.inject.Inject
import jakarta.persistence.EntityManager
import org.eclipse.microprofile.jwt.JsonWebToken
import java.util.*
import java.util.stream.Collectors

class ListProjectsFunction {

    @Inject
    lateinit var jwt: JsonWebToken

    @Inject
    lateinit var em: EntityManager

    @Funq
    fun list(): List<ProjectDto> {
        return em.createQuery("SELECT p FROM Project p WHERE p.userId = :sub", Project::class.java)
            .setParameter("sub", UUID.fromString(jwt.subject))
            .resultList
            .stream()
            .map { project -> project.toDto() }
            .collect(Collectors.toList())
    }

    @Funq
    fun get(id: UUID): ProjectDto {
        return em.createQuery("SELECT p FROM Project p WHERE p.userId = :sub AND p.extId = :id", Project::class.java)
            .setParameter("sub", UUID.fromString(jwt.subject))
            .setParameter("id", id)
            .singleResult
            .toDto()
    }
}
