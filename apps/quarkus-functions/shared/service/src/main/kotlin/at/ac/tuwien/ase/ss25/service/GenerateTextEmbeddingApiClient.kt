package at.ac.tuwien.ase.ss25.service

import io.vertx.core.Vertx
import io.vertx.ext.web.client.WebClient
import jakarta.enterprise.context.ApplicationScoped
import jakarta.inject.Named
import org.eclipse.microprofile.config.inject.ConfigProperty

@ApplicationScoped
@Named
class GenerateTextEmbeddingApiClient(
    private val vertx: Vertx
) {

    @ConfigProperty(name = "LIMELAPSE_EMBEDDING_URL", defaultValue = "http://ml-embedding-service/text")
    lateinit var embeddingUrl: String

    fun generateEmbedding(request: EmbeddingRequest): EmbeddingResponseDto {
        val client = WebClient.create(vertx)

        val prompt = "Describe a photo taken at a construction site that clearly shows: ${request.text}" +
                "Include details about materials, machinery, structures, colors, and environment typical of building sites."

        return client.postAbs(embeddingUrl)
            .sendJson(
                mapOf("text" to prompt)
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
    val text: String = "",
)
