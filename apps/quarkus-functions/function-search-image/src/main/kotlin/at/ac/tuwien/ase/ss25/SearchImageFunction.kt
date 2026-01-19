package at.ac.tuwien.ase.ss25

import at.ac.tuwien.ase.ss25.models.PictureEmbedding
import at.ac.tuwien.ase.ss25.service.EmbeddingRequest
import at.ac.tuwien.ase.ss25.service.GenerateTextEmbeddingApiClient
import io.quarkus.funqy.Funq
import jakarta.inject.Inject
import jakarta.persistence.EntityManager
import jakarta.persistence.Query
import org.eclipse.microprofile.jwt.JsonWebToken
import org.hibernate.HibernateException
import org.slf4j.LoggerFactory
import java.util.*
import kotlin.math.sqrt

class SearchImageFunction(
    private val embeddingClient: GenerateTextEmbeddingApiClient,
    private val entityManager: EntityManager,
) {
    private val logger = LoggerFactory.getLogger(SearchImageFunction::class.java)

    @Inject
    lateinit var jwt: JsonWebToken

    @Funq
    fun search(searchParams: SearchParams): SearchResults {
        val results = if ("" == searchParams.query) searchAll(searchParams) else searchByEmbedding(searchParams);
        return results
    }

    private fun searchAll(searchParams: SearchParams): SearchResults {
        val querySelect = "SELECT pe"
        val countSelect = "SELECT count(pe)"
        var queryBody =
            "FROM PictureEmbedding pe inner join Project p on p.id = pe.projectId WHERE p.extId = :projectId and p.userId = :userId"
        if (searchParams.timeStart != null && searchParams.timeStart!=0L) {
            queryBody += " AND pe.extractedTimestamp >= :timeStart"
        }
        if (searchParams.timeEnd != null && searchParams.timeEnd!=0L) {
            queryBody += " AND pe.extractedTimestamp <= :timeEnd"
        }

        val queryOrder = " ORDER BY pe.pictureUUID ASC"

        val query = entityManager.createQuery("$querySelect $queryBody $queryOrder", PictureEmbedding::class.java)
        setQueryParams(query, searchParams)

        try {
            val results = query
                .setFirstResult((searchParams.page * searchParams.size).toInt())
                .setMaxResults(searchParams.size.toInt())
                .resultList

            val countQuery =
                entityManager.createQuery(
                    "$countSelect $queryBody",
                    Long::class.java
                )

            setQueryParams(countQuery, searchParams)

            val total = countQuery.singleResult

            return SearchResults(
                totalResults = total,
                hits = results.map { SearchResult(it.pictureUUID, distance = 0f) }
            )
        } catch (e: Exception) {
            return handleEmptyResult(e)
        }
    }


    private fun searchByEmbedding(searchParams: SearchParams): SearchResults {
        val embedding = embeddingClient.generateEmbedding(EmbeddingRequest(searchParams.query))

        // Use native SQL to leverage pgvector operations
        //This is a risk for SQL Injection...
        val vectorString = embedding.embedding.joinToString(prefix = "[", postfix = "]")
        logger.info("received embedding with ${embedding.embedding.size} dimensions")
        logger.info("vector norm ${sqrt(embedding.embedding.sumOf { it * it })}")
        //TODO check if vectors are normalized for cosine similarity
        val selectString = "SELECT pe.picture_uuid, pe.embedding <=> CAST(:embedding AS vector) AS distance"
        val countString = "SELECT count(*)"
        val queryBody = """
        FROM picture_embedding pe inner join project p on pe.project_id = p.id 
        WHERE p.ext_id = :projectId and p.user_id = :userId
        ${if (searchParams.timeStart != null && searchParams.timeStart!=0L) "AND pe.extracted_timestamp >= :timeStart" else ""}
        ${if (searchParams.timeEnd != null && searchParams.timeEnd!=0L) "AND pe.extracted_timestamp <= :timeEnd" else ""}
    """.trimIndent()
        val queryPagination = "ORDER BY distance ASC LIMIT :limit OFFSET :offset"

        val selectQuery = entityManager.createNativeQuery("$selectString $queryBody $queryPagination")
            .setParameter("embedding", vectorString)
            .setParameter("limit", searchParams.size)
            .setParameter("offset", searchParams.page * searchParams.size)
        val countQuery = entityManager.createNativeQuery("$countString $queryBody")
        setQueryParams(selectQuery, searchParams)
        setQueryParams(countQuery, searchParams)

        try {
            val resultList = selectQuery.resultList.filterIsInstance<Array<*>>()

            val hits = resultList.map {
                val imageId = UUID.fromString(it[0].toString())
                val distance = (it[1] as Number).toFloat()
                SearchResult(imageId, distance)
            }

            val count = (countQuery.singleResult as Number).toLong()

            return SearchResults(
                totalResults = count,
                hits = hits
            )
        } catch (e: Exception) {
            return handleEmptyResult(e)
        }
    }

    private fun handleEmptyResult(e: Exception): SearchResults {
        if (e is HibernateException && e.message.orEmpty().contains("No results were returned by the query")) {
            return SearchResults(
                totalResults = 0,
                hits = emptyList()
            )
        }
        logger.warn("error during search ${e.message}", e)

        throw e
    }

    private fun setQueryParams(
        query: Query,
        searchParams: SearchParams,
    ) {
        val userId = UUID.fromString(jwt.subject)
        query.setParameter("projectId", searchParams.projectId)
        query.setParameter("userId", userId)
        if(searchParams.timeStart != null && searchParams.timeStart!=0L) {
            query.setParameter("timeStart", java.time.Instant.ofEpochMilli(searchParams.timeStart))
        }
        if(searchParams.timeEnd != null && searchParams.timeEnd!=0L) {
            query.setParameter("timeEnd", java.time.Instant.ofEpochMilli(searchParams.timeEnd))
        }
    }

    data class SearchParams(
        val projectId: UUID = UUID.fromString("00000000-0000-0000-0000-000000000000"),
        val query: String = "",
        val timeStart: Long? = null,
        val timeEnd: Long? = null,
        val page: Long = 0,
        val size: Long = 50
    )

    data class SearchResults(
        val totalResults: Long,
        val hits: List<SearchResult>
    )

    data class SearchResult(
        val imageId: UUID,
        val distance: Float
    )

}