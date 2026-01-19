plugins {
    id("at.ac.tuwien.ase.knative-func")
}

dependencies {
    implementation(project(":shared:persistence"))
    implementation("io.quarkus:quarkus-hibernate-orm")
    implementation("io.quarkus:quarkus-jdbc-postgresql")
    implementation("io.quarkus:quarkus-rest-client-jackson")
    implementation("io.quarkiverse.minio:quarkus-minio")
    implementation("io.quarkus:quarkus-funqy-knative-events")
    implementation("com.fasterxml.uuid:java-uuid-generator:5.1.0")
}