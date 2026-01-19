package at.ac.tuwien.ase.ss25.models

import jakarta.persistence.*
import java.time.OffsetDateTime
import java.util.*

enum class VideoState {
    QUEUED,
    PROCESSING,
    FINISHED
}

@Entity
@Table(name = "video")
data class Video(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long = 0,

    @Column(name = "ext_id", columnDefinition = "UUID", unique = true, nullable = false)
    var extId: UUID = UUID.randomUUID(),

    @Column(name = "user_id", nullable = false)
    var userId: UUID = UUID.fromString("00000000-0000-0000-0000-000000000000"),

    @Column(name = "project_id", nullable = false)
    var projectId: UUID = UUID.fromString("00000000-0000-0000-0000-000000000000"),

    @Column(name = "created_at")
    var createdAt: OffsetDateTime? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    var status: VideoState = VideoState.QUEUED
)