package at.ac.tuwien.ase.ss25.models

import at.ac.tuwien.ase.ss25.dtos.ProjectDto
import jakarta.persistence.*
import org.hibernate.annotations.CreationTimestamp
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime
import java.util.*

@Entity
@Table(name = "project", uniqueConstraints = [UniqueConstraint(columnNames = ["name", "user_id"], name = "uc_project_name_user_id"), UniqueConstraint(columnNames = ["ext_id"], name = "uc_project_ext_id")])
open class Project(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long = 0,

    @Column(name = "ext_id", columnDefinition = "UUID", nullable = false)
    var extId: UUID = UUID.randomUUID(),

    @Column(nullable = false)
    var name: String = "",

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: Instant = Instant.MIN,

    @Column(name = "user_id", columnDefinition = "UUID", nullable = false)
    var userId: UUID = UUID.fromString("00000000-0000-0000-0000-000000000000"),

    @Column
    var description: String? = null,

    @Column(name = "start_date")
    var start: LocalDate? = null,

    @Column(name = "end_date")
    var end: LocalDate? = null,

    @Column(name = "capture_start")
    var captureStart: LocalTime? = null,

    @Column(name = "capture_end")
    var captureEnd: LocalTime? = null
)

fun ProjectDto.toProject(): Project {
    return Project(
        name = this.name!!,
        description = this.description,
        start = this.start,
        end = this.end,
        captureStart = this.captureStart,
        captureEnd = this.captureEnd
    )
}
