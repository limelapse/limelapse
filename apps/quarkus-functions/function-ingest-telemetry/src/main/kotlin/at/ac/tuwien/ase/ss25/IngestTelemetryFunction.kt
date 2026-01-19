package at.ac.tuwien.ase.ss25

import at.ac.tuwien.ase.ss25.dtos.TelemetryDto
import at.ac.tuwien.ase.ss25.dtos.toTelemetry
import at.ac.tuwien.ase.ss25.models.Telemetry
import io.quarkus.funqy.Funq
import jakarta.inject.Inject
import jakarta.persistence.EntityManager
import jakarta.transaction.Transactional

class IngestTelemetryFunction {

    @Inject
    lateinit var em: EntityManager

    @Funq
    @Transactional
    fun ingest(dto: TelemetryDto): Long {
        val telemetry = dto.toTelemetry()
        em.persist(telemetry)
        return telemetry.id
    }
}
