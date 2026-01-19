package at.ac.tuwien.ase.ss25.dtos

import at.ac.tuwien.ase.ss25.models.Video
import at.ac.tuwien.ase.ss25.models.VideoState
import java.time.OffsetDateTime
import java.util.UUID

data class VideoDto(
    var id: UUID?,
    var userId: UUID?,
    var createdAt: OffsetDateTime?,
    var status: VideoState?
) {
    constructor(): this(null, null, null, null)
}

fun Video.toDto(): VideoDto {
    return VideoDto(
        id = extId,
        userId = userId,
        createdAt = createdAt,
        status = status,
    )
}