plugins {
    id("at.ac.tuwien.ase.knative-func")
    id("org.kordamp.gradle.jandex") version "1.0.0"
}

dependencies {
    implementation("io.quarkus:quarkus-rest-client-jackson")
}

tasks.named("quarkusDependenciesBuild") {
    dependsOn(tasks.named("jandex"))
}