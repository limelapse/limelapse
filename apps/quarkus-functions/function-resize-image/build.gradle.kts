plugins {
    id("at.ac.tuwien.ase.knative-func")
}

dependencies {
    implementation("io.quarkus:quarkus-rest-client-jackson")
    implementation("io.quarkiverse.minio:quarkus-minio")
    implementation("io.quarkus:quarkus-funqy-knative-events")
}