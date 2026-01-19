plugins {
    id("at.ac.tuwien.ase.knative-func")
}

dependencies {
    implementation(project(":shared:persistence"))
    implementation(project(":shared:service"))
    implementation("io.quarkus:quarkus-oidc")
    implementation("io.quarkus:quarkus-security")
    implementation("io.quarkus:quarkus-hibernate-orm")
    implementation("io.quarkus:quarkus-jdbc-postgresql")
    implementation("io.quarkus:quarkus-rest-client-jackson")
    implementation("com.fasterxml.uuid:java-uuid-generator:5.1.0")
    implementation("io.quarkus:quarkus-funqy-knative-events")
}