plugins {
    id("at.ac.tuwien.ase.knative-func")
}

dependencies {
    implementation(project(":shared:persistence"))
    implementation("io.quarkus:quarkus-oidc")
    implementation("io.quarkus:quarkus-security")
    implementation("io.quarkus:quarkus-hibernate-orm")
    implementation("io.quarkus:quarkus-jdbc-postgresql")
}