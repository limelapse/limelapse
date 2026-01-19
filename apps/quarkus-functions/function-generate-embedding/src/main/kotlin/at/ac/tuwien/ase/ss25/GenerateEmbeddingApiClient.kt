package at.ac.tuwien.ase.ss25

import io.vertx.core.Vertx
import io.vertx.ext.web.client.WebClient
import io.vertx.ext.web.multipart.MultipartForm
import jakarta.enterprise.context.ApplicationScoped
import jakarta.inject.Named
import org.eclipse.microprofile.config.inject.ConfigProperty

@ApplicationScoped
@Named
class GenerateEmbeddingApiClient(
    private val vertx: Vertx
) {

    @ConfigProperty(name = "LIMELAPSE_EMBEDDING_URL", defaultValue = "http://ml-embedding-service/image")
    lateinit var embeddingUrl: String

    fun generateEmbedding(request: EmbeddingRequest): EmbeddingResponseDto {
        val client = WebClient.create(vertx)

        return client.postAbs(embeddingUrl)
            .sendMultipartForm(
            MultipartForm.create().apply {
                attribute("url", request.url)
            }
        )
            .toCompletionStage()
            .toCompletableFuture()
            .get()
            .bodyAsJson(EmbeddingResponseDto::class.java)
    }
}

data class EmbeddingResponseDto(
    val dimension: Int = 0,
    val embedding: List<Double> = emptyList(),
)

data class EmbeddingRequest(
    val url: String = "",
)
