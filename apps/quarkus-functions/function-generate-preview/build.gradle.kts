plugins {
    id("at.ac.tuwien.ase.knative-func")
}

dependencies {
    implementation(project(":shared:service"))
    implementation(project(":shared:persistence"))
    implementation("io.quarkus:quarkus-oidc")
    implementation("io.quarkus:quarkus-security")
    implementation("io.quarkus:quarkus-hibernate-orm")
    implementation("io.quarkus:quarkus-jdbc-postgresql")
    implementation("io.quarkus:quarkus-rest-client-jackson")
    implementation("io.quarkus:quarkus-resteasy-reactive:3.15.5")
    implementation("io.quarkus:quarkus-resteasy-reactive-jackson:3.15.5")
}