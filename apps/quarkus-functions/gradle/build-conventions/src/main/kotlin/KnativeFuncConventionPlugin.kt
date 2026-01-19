import org.gradle.api.Plugin
import org.gradle.api.Project

class KnativeFuncConventionPlugin : Plugin<Project> {
    override fun apply(project: Project): Unit = with(project) {
        plugins.apply("io.quarkus")
        plugins.apply("at.ac.tuwien.ase.kotlin")

        group = "at.ac.tuwien.ase.func"
        version = "1.0.0"

        dependencies.apply {
            add("implementation", "io.quarkus:quarkus-container-image-docker")
            add("implementation", "io.quarkus:quarkus-funqy-http")
            add("api", platform("io.quarkus:quarkus-bom:3.21.3"))
            add("runtimeOnly", project(":shared:oidc-configuration"))
            add("testImplementation", "io.quarkus:quarkus-junit5")
            add("testImplementation", "io.rest-assured:rest-assured")
            add("testImplementation", "org.assertj:assertj-core:3.25.3")
        }

        extensions.extraProperties["quarkusPlatformVersion"] = "3.21.3"

        // Optional debug task
        tasks.register("printFunqy") {
            doLast {
                println("✅ Funqy Function scaffold applied with Kotlin 2.1.20 and Quarkus 3.21.3")
            }
        }
    }
}