package at.ac.tuwien.ase.ss25

import at.ac.tuwien.ase.ss25.dtos.TelemetryDto
import at.ac.tuwien.ase.ss25.dtos.toDto
import at.ac.tuwien.ase.ss25.models.Telemetry
import io.quarkus.funqy.Funq
import jakarta.inject.Inject
import jakarta.persistence.EntityManager
import java.time.Instant
import java.util.*

class RetrieveTelemetryFunction {

    @Inject
    lateinit var em: EntityManager

    @Funq
    fun latest(projectId: UUID): TelemetryDto? {
        val telemetry = em.createQuery(
            """
            SELECT t FROM Telemetry t
            JOIN Project p ON t.projectId = p.extId
            WHERE p.extId = :projectId
            ORDER BY t.timestamp DESC
            """.trimIndent(),
            Telemetry::class.java
        )
            .setParameter("projectId", projectId)
            .setMaxResults(1)
            .resultList
            .firstOrNull()

        return telemetry?.toDto()
    }
}

data class ProjectIdRequest(val projectId: UUID)