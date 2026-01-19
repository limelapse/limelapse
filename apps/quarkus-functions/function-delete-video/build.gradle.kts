plugins {
    id("at.ac.tuwien.ase.knative-func")
    id("at.ac.tuwien.ase.kotlin")
}

dependencies {
    implementation(project(":shared:persistence"))
    implementation("io.quarkus:quarkus-oidc")
    implementation("io.quarkus:quarkus-security")
    implementation("io.quarkiverse.minio:quarkus-minio")
    implementation("io.quarkus:quarkus-hibernate-orm")
    implementation("io.quarkus:quarkus-jdbc-postgresql")
}