rootProject.name = "quarkus-functions"


// Include subprojects here
include("function-blur-image")
include("function-create-project")
include("function-delete-project")
include("function-delete-video")
include("function-file-access")
include("function-file-upload")
include("function-finish-video")
include("function-generate-video")
include("function-generate-preview")
include("function-get-video")
include("function-ingest-telemetry")
include("function-get-telemetry")
include("function-list-projects")
include("function-list-videos")
include("function-minio-event")
include("function-resize-image")
include("function-process-video")
include("function-update-project")
include("function-generate-embedding")
include("function-search-image")
include("function-search-heatmap")
include(":shared:oidc-configuration")
include(":shared:persistence")
include(":shared:service")

// Convention plugins
includeBuild("gradle/build-conventions")