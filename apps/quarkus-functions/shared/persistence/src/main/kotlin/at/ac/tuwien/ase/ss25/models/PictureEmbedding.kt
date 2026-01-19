package at.ac.tuwien.ase.ss25.models

import jakarta.persistence.Basic
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "picture_embedding")
open class PictureEmbedding {
    @Column(name = "picture_uuid")
    @Id
    var pictureUUID: UUID = UUID.randomUUID()

    @Column(name = "project_id")
    var projectId: Long? = null

    @Column
    @Basic(fetch = FetchType.LAZY)
    var embedding: List<Double> = emptyList()

    @Column(name = "extracted_timestamp")
    var extractedTimestamp: Instant = Instant.MIN
}