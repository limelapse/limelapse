package at.ac.tuwien.ase.ss25

import java.util.UUID

fun extractTimestampFromUUIDv7(uuid: UUID): Long {
    val msb = uuid.mostSignificantBits
    val timestamp = (msb ushr 16) and 0xFFFFFFFFFFFFL
    return timestamp
}