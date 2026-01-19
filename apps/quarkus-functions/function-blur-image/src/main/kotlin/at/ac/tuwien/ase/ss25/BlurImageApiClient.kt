package at.ac.tuwien.ase.ss25

import io.vertx.core.Vertx
import io.vertx.ext.web.client.WebClient
import io.vertx.ext.web.multipart.MultipartForm
import jakarta.enterprise.context.ApplicationScoped
import jakarta.inject.Named
import org.eclipse.microprofile.config.inject.ConfigProperty

@ApplicationScoped
@Named
class BlurImageApiClient(
    private val vertx: Vertx
) {

    @ConfigProperty(name = "LIMELAPSE_EMBEDDING_URL", defaultValue = "http://ml-blurring-service/faces")
    lateinit var blurringUrl: String

    fun blurImage(request: BlurImageRequest) {
        val client = WebClient.create(vertx)

        client.postAbs(blurringUrl).sendMultipartForm(
            MultipartForm.create().apply {
                attribute("url", request.url)
                attribute("upload_url", request.uploadUrl)
            }
        ).result()
    }

}

data class BlurImageRequest(
    val url: String = "",
    val uploadUrl: String = ""
)
