package at.ac.tuwien.ase.ss25.dtos

import at.ac.tuwien.ase.ss25.models.Telemetry
import java.time.Instant
import java.util.*


data class TelemetryDto(
    var id: Long? = null,
    var projectId: UUID? = null,
    var timestamp: Instant? = null,
    var name: String? = null,
    var model: String? = null,
    var isCharging: Boolean? = null,
    var batteryPercentage: Int? = null,
    var memUsed: Int? = null,
    var uploadDuration: Int? = null
) {
    constructor() : this(null, null, null, null, null, null, null, null, null)
}

fun Telemetry.toDto(): TelemetryDto {
    return TelemetryDto(
        id = this.id,
        projectId = this.projectId,
        timestamp = this.timestamp,
        name = this.name,
        model = this.model,
        isCharging = this.isCharging,
        batteryPercentage = this.batteryPercentage,
        memUsed = this.memUsed,
        uploadDuration = this.uploadDuration
    )
}

fun TelemetryDto.toTelemetry(): Telemetry {
    return Telemetry(
        id = this.id ?: 0,
        projectId = this.projectId ?: null,
        timestamp = this.timestamp ?: Instant.now(),
        name = this.name,
        model = this.model,
        isCharging = this.isCharging,
        batteryPercentage = this.batteryPercentage,
        memUsed = this.memUsed,
        uploadDuration = this.uploadDuration
    )
}
