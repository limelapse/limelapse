package at.ac.tuwien.ase.ss25.models

import jakarta.persistence.*
import org.hibernate.annotations.CreationTimestamp
import java.time.Instant
import java.util.*

@Entity
@Table(name = "telemetry")
open class Telemetry(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long = 0,

    @Column(name = "project_id")
    var projectId: UUID? = null,

    @CreationTimestamp
    @Column(name = "timestamp", nullable = false, updatable = false)
    var timestamp: Instant = Instant.MIN,

    @Column(name = "name")
    var name: String? = null,

    @Column(name = "model")
    var model: String? = null,

    @Column(name = "is_charging")
    var isCharging: Boolean? = null,

    @Column(name = "battery_percentage")
    var batteryPercentage: Int? = null,

    @Column(name = "mem_used")
    var memUsed: Int? = null,

    @Column(name = "upload_duration")
    var uploadDuration: Int? = null
)
