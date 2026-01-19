package at.ac.tuwien.ase.ss25.dtos

import at.ac.tuwien.ase.ss25.models.Project
import java.time.LocalDate
import java.time.LocalTime
import java.util.*

data class ProjectDto(
    var id: UUID?,
    var name: String?,
    var description: String?,
    var start: LocalDate?,
    var end: LocalDate?,
    var captureStart: LocalTime?,
    var captureEnd: LocalTime?
) {
    constructor(): this(null, null, null, null, null, null, null) // needed for funqy marshalling
}

fun Project.toDto(): ProjectDto {
    return ProjectDto(
        id = this.extId,
        name = this.name,
        description = this.description,
        start = this.start,
        end = this.end,
        captureStart = this.captureStart,
        captureEnd = this.captureEnd,
    )
}
