package at.ac.tuwien.ase.ss25.service

import jakarta.ws.rs.Consumes
import jakarta.ws.rs.POST
import jakarta.ws.rs.Path
import jakarta.ws.rs.Produces
import jakarta.ws.rs.QueryParam
import jakarta.ws.rs.core.MediaType
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient
import java.net.URL
import java.util.concurrent.CompletionStage

@Path("")
@RegisterRestClient(configKey = "timelapseexport")
interface TimelapseExportService {
    @POST
    @Path("process/async")
    @Consumes(MediaType.TEXT_PLAIN)
    @Produces(MediaType.TEXT_PLAIN) //This decides we want to retrieve an async reference
    fun processAsync(
        @QueryParam("input_bucket") inputBucket: String,
        @QueryParam("output_bucket") outputBucket: String,
        @QueryParam("timelapse_name") name: String,
        content: String
    ): CompletionStage<URL>

    @POST
    @Path("process/sync")
    @Consumes(MediaType.TEXT_PLAIN)
    @Produces("video/mp4")
    fun processSync(
        @QueryParam("input_bucket") inputBucket: String,
        @QueryParam("duration") duration: Long,
        content: String
    ): CompletionStage<ByteArray>
}