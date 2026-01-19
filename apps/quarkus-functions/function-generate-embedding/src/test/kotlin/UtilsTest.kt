import at.ac.tuwien.ase.ss25.extractTimestampFromUUIDv7
import com.fasterxml.uuid.Generators
import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.Test
import java.time.Instant

class UtilsTest {

    @Test
    fun `should extract correct timestamp from UUIDv7`() {
        val knownTimestamp = Instant.parse("2025-06-04T12:00:00Z").toEpochMilli()

        val uuid = Generators.timeBasedEpochGenerator().construct(knownTimestamp)

        val extracted = extractTimestampFromUUIDv7(uuid)

        Assertions.assertEquals(knownTimestamp, extracted, "Extracted timestamp should match original")
    }
}