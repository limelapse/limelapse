package at.ac.tuwien.ase.ss25

import com.fasterxml.uuid.Generators
import io.minio.GetPresignedObjectUrlArgs
import io.minio.MinioClient
import io.minio.http.Method
import io.quarkus.funqy.Funq
import jakarta.annotation.security.RolesAllowed
import jakarta.inject.Inject
import jakarta.persistence.EntityManager
import org.eclipse.microprofile.config.inject.ConfigProperty
import org.eclipse.microprofile.jwt.JsonWebToken
import java.util.*
import java.util.concurrent.TimeUnit

class FileUploadFunction {

    @Inject
    lateinit var jwt: JsonWebToken

    @Inject
    lateinit var client: MinioClient

    @ConfigProperty(name = "MINIO_IMAGES_BUCKET")
    lateinit var bucket: String

    @ConfigProperty(name = "LIMELAPSE_MINIO_INGRESS_URL", defaultValue = "https://download.limelapse.com")
    lateinit var minioIngressUrl: String

    @ConfigProperty(name = "LIMELAPSE_MINIO_SERVICE_URL", defaultValue = "http://minio:9000")
    lateinit var minioServiceUrl: String


    @Inject
    lateinit var em: EntityManager

    @Funq
    @RolesAllowed("user")
    fun upload(dto: FileUploadDto): String {
        em.createQuery("SELECT p FROM Project p WHERE userId=:user_id AND extId=:id")
            .setParameter("user_id", UUID.fromString(jwt.subject))
            .setParameter("id", dto.projectId)
            .singleResult // throws exception if project does not exist

        var uuid: UUID;
        if (dto.timestamp == null) {
            uuid = Generators.timeBasedEpochGenerator().generate() // timestamp based version 7 UUID
        } else {
            uuid = Generators.timeBasedEpochGenerator().construct(dto.timestamp!!) // timestamp based version 7 UUID
        }

        // get pre-signed url form minio
        return client.getPresignedObjectUrl(
            GetPresignedObjectUrlArgs
                .builder()
                .bucket(bucket)
                .`object`("${jwt.subject}/${dto.projectId}/urn:uuid:${uuid}:resolution:original:sharpness:sharp")
                .method(Method.PUT)
                .expiry(1, TimeUnit.HOURS)
                .build()
        ).replaceFirst(minioServiceUrl, minioIngressUrl)
    }
}

data class FileUploadDto(
    var projectId: UUID?,
    var timestamp: Long?
) {
    constructor() : this(null, null)
}