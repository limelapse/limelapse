package at.ac.tuwien.ase.ss25

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

class SearchHeatmapFunction(
    private val embeddingClient: GenerateTextEmbeddingApiClient,
    private val entityManager: EntityManager,
) {
    private val logger = LoggerFactory.getLogger(SearchHeatmapFunction::class.java)

    @Inject
    lateinit var jwt: JsonWebToken

    @Funq
    fun search(searchParams: SearchParams): SearchResults {
        val results = if ("" == searchParams.query) searchEmpty(searchParams) else searchByEmbedding(searchParams);
        return results
    }

    private fun searchEmpty(searchParams: SearchParams): SearchResults {
        val sql = """
            SELECT
              MIN((EXTRACT(EPOCH FROM pe.extracted_timestamp) * 1000)::BIGINT) AS latest_picture,
              MAX((EXTRACT(EPOCH FROM pe.extracted_timestamp) * 1000)::BIGINT) AS earliest_picture
            FROM picture_embedding pe
            JOIN project p ON pe.project_id = p.id
            WHERE p.ext_id = :projectId AND p.user_id = :userId
              AND (CAST(:timeStart as TIMESTAMP) IS NULL OR pe.extracted_timestamp >= TO_TIMESTAMP(:timeStart))
              AND (CAST(:timeEnd as TIMESTAMP) IS NULL OR pe.extracted_timestamp <= TO_TIMESTAMP(:timeEnd))
            """.trimIndent()

        val query = entityManager.createNativeQuery(sql)
        setQueryParams(query,searchParams)

        return try {
            val row = query.singleResult as? Array<*>
            val start = (row?.get(0) as? Number)?.toLong() ?: 0L
            val end = (row?.get(1) as? Number)?.toLong() ?: 0L
            return SearchResults(start = start, end = end)
        } catch (e: Exception) {
            handleEmptyResult(e)
        }
    }

    private fun searchByEmbedding(searchParams: SearchParams): SearchResults {
        val embedding = embeddingClient.generateEmbedding(EmbeddingRequest(searchParams.query))

        // Use native SQL to leverage pgvector operations
        //This is a risk for SQL Injection...
        val vectorString = embedding.embedding.joinToString(prefix = "[", postfix = "]")
        logger.info("received embedding with ${embedding.embedding.size} dimensions")
        logger.info("vector norm ${sqrt(embedding.embedding.sumOf { it * it })}")
        //TODO check if vectors are normalized for cosine distance
        val sql = """
        WITH raw_bounds AS (
            SELECT 
                MIN(pe.extracted_timestamp) AS actual_min_time,
                MAX(pe.extracted_timestamp) AS actual_max_time
            FROM picture_embedding pe
            JOIN project p ON pe.project_id = p.id
            WHERE p.ext_id = :projectId AND p.user_id = :userId
        ),
        bounds AS (
            SELECT
                COALESCE(:timeStart, rb.actual_min_time) AS min_time,
                COALESCE(:timeEnd, rb.actual_max_time) AS max_time,
                (
                    COALESCE(:timeEnd, rb.actual_max_time) -
                    COALESCE(:timeStart, rb.actual_min_time)
                ) / :numSlices AS interval
            FROM raw_bounds rb
        ),
        slices AS (
            SELECT generate_series(0, :numSlices - 1) AS bucket_index
        ),
        ranked AS (
            SELECT
                floor(extract(epoch from (pe.extracted_timestamp - b.min_time)) / extract(epoch from b.interval)) AS bucket_index,
                pe.extracted_timestamp,
                pe.embedding <=> CAST(:embedding AS vector) AS distance
            FROM picture_embedding pe
            JOIN project p ON pe.project_id = p.id,
                 bounds b
            WHERE p.ext_id = :projectId AND p.user_id = :userId
              AND pe.extracted_timestamp >= b.min_time AND pe.extracted_timestamp <= b.max_time
        )
        ,
        aggregated AS (
            SELECT
                r.bucket_index,
                MIN(r.extracted_timestamp) AS slice_start,
                AVG(r.distance) AS avg_distance
            FROM ranked r
            GROUP BY r.bucket_index
        )
        SELECT
            s.bucket_index,
            COALESCE(a.slice_start, b.min_time + s.bucket_index * b.interval) AS slice_start,
            1 - a.avg_distance,
            (EXTRACT(EPOCH FROM rb.actual_min_time) * 1000)::BIGINT AS earliest_picture,
            (EXTRACT(EPOCH FROM rb.actual_max_time) * 1000)::BIGINT AS latest_picture
        FROM slices s
        CROSS JOIN bounds b
        CROSS JOIN raw_bounds rb
        LEFT JOIN aggregated a ON a.bucket_index = s.bucket_index
        ORDER BY s.bucket_index
        """.trimIndent()

        val query = entityManager.createNativeQuery(sql)

        // Set required parameters
        setQueryParams(query,searchParams)
        query.setParameter("embedding", vectorString)

        //use 100 slices per default
        query.setParameter("numSlices", 100)

        try {
            val resultList = query.resultList
            val result =  resultList.mapNotNull {
                val row = it as? Array<*> ?: return@mapNotNull 0f
                return@mapNotNull (row[2] as? Number)?.toFloat() ?: 0f
            }
            val firstRow = resultList.first() as? Array<*>
            val start = (firstRow?.get(3) as? Number)?.toLong() ?: 0L
            val end = (firstRow?.get(4) as? Number)?.toLong() ?: 0L

            return SearchResults(
                heatmap = result.toFloatArray(),
                start = start,
                end = end
            )
        } catch (e: Exception) {
            return handleEmptyResult(e)
        }
    }

    private fun handleEmptyResult(e: Exception): SearchResults {
        if (e is HibernateException && e.message.orEmpty().contains("No results were returned by the query")) {
            return SearchResults()
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

        if (searchParams.timeStart != null) {
            query.setParameter("timeStart", searchParams.timeStart)
        } else {
            query.setParameter("timeStart", null)
        }

        if (searchParams.timeEnd != null) {
            query.setParameter("timeEnd", searchParams.timeEnd)
        } else {
            query.setParameter("timeEnd", null)
        }
    }

    data class SearchParams(
        val projectId: UUID = UUID.fromString("00000000-0000-0000-0000-000000000000"),
        val query: String = "",
        val timeStart: Long? = null,
        val timeEnd: Long? = null,
    )

    data class SearchResults(
        val heatmap: FloatArray = floatArrayOf(),
        val start: Long? = null,
        val end: Long? = null,
    ) {
        override fun equals(other: Any?): Boolean {
            if (this === other) return true
            if (javaClass != other?.javaClass) return false

            other as SearchResults

            return heatmap.contentEquals(other.heatmap)
        }

        override fun hashCode(): Int {
            return heatmap.contentHashCode()
        }
    }

}