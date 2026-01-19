package at.ac.tuwien.ase.ss25

import io.minio.credentials.Credentials
import io.minio.credentials.Jwt
import io.minio.credentials.WebIdentityProvider
import io.quarkus.funqy.Funq
import jakarta.annotation.security.RolesAllowed
import jakarta.inject.Inject
import jakarta.persistence.EntityManager
import org.eclipse.microprofile.config.inject.ConfigProperty
import org.eclipse.microprofile.jwt.JsonWebToken
import java.util.*

class FileAccessFunction {

    @Inject
    lateinit var jwt: JsonWebToken

    @ConfigProperty(name = "QUARKUS_MINIO_HOST")
    lateinit var host: String

    @ConfigProperty(name = "QUARKUS_MINIO_PORT")
    lateinit var port: String

    @ConfigProperty(name = "MINIO_IMAGES_BUCKET")
    lateinit var bucket: String

    @Inject
    lateinit var em: EntityManager

    @Funq
    @RolesAllowed("user")
    fun files(project: UUID?): Credentials {
        var policy: String? = null // null policy will result in user scoped credentials defined by minio
        if (project != null) {
            em.createQuery("SELECT p FROM Project p WHERE userId=:user_id AND extId=:id")
                .setParameter("user_id", UUID.fromString(jwt.subject))
                .setParameter("id", project)
                .singleResult // throws exception if project does not exist

            // minio policy describing the user can issue get requests on the project images
            policy = """
            {
              "Version": "2012-10-17",
              "Statement": [
                    {
                       "Action": ["s3:ListBucket"],
                       "Effect": "Allow",
                       "Resource": ["arn:aws:s3:::${bucket}"],
                       "Condition": {"StringLike": {"s3:prefix": ["${jwt.subject}/${project}/*"]}}
                    }, 
                    {
                       "Action": ["s3:GetObject"],
                       "Effect": "Allow",
                       "Resource": ["arn:aws:s3:::${bucket}/${jwt.subject}/${project}/*"]
                    }
                 ]
            }
            """.trimIndent()
        }
        // get sts credentials
        val credentials = WebIdentityProvider(
            { Jwt(jwt.rawToken, jwt.expirationTime.toInt()) },
            "http://${host}:${port}",
            null, // duration will be same as jwt
            policy,
            null,
            null,
            null
        ).fetch()
        return credentials
    }
}