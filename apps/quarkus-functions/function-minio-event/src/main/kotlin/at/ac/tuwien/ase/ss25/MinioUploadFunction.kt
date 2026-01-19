package at.ac.tuwien.ase.ss25

import com.fasterxml.jackson.annotation.JsonProperty
import io.quarkus.funqy.Funq
import io.vertx.core.Vertx
import io.vertx.ext.web.client.WebClient
import org.slf4j.LoggerFactory
import java.net.URLDecoder
import java.util.*

class MinioUploadFunction(
    private val vertx: Vertx
) {

    private val logger = LoggerFactory.getLogger(this::class.java)


    @Funq
    fun `on-upload-event`(event: Event) {
        val bucketName = event.records.firstOrNull()?.s3Info?.bucket?.name.orEmpty()
        val objectPath = URLDecoder.decode(event.records.firstOrNull()?.s3Info?.objectInfo?.key.orEmpty(), "UTF-8")

        when {
            bucketName.isEmpty() || objectPath.isEmpty() -> run {
                logger.warn("faulty event representation $event")
                return
            }
        }

        WebClient.create(vertx)
            .postAbs("http://kafka-broker-ingress.knative-eventing.svc.cluster.local/default/default")
            .putHeader("Ce-Id", UUID.randomUUID().toString())
            .putHeader("Ce-Specversion", "1.0")
            .putHeader("Ce-Type", "MinioUpload")
            .putHeader("Ce-Source", "MinioUploadFunction")
            .sendJson(mapOf(
                "bucket" to bucketName,
                "path" to objectPath,
            )).result()
    }
}

data class Event(
    @JsonProperty("Records")
    val records: List<Record> = emptyList()
)


data class Record(
    @JsonProperty("s3")
    val s3Info: S3Info? = null,
)

data class ObjectInfo(
    val key: String = ""
)

data class S3Info(
    @JsonProperty("bucket")
    val bucket: Bucket? = null,
    @JsonProperty("object")
    val objectInfo: ObjectInfo? = null
)

data class Bucket(
    val name: String = ""
)