import org.gradle.api.Plugin
import org.gradle.api.Project
import org.gradle.api.plugins.JavaPluginExtension
import org.gradle.jvm.toolchain.JavaLanguageVersion
import org.gradle.kotlin.dsl.getByType

class KotlinConventionPlugin : Plugin<Project> {
    override fun apply(project: Project): Unit = with(project) {
        plugins.apply("org.jetbrains.kotlin.jvm")

        group = "at.ac.tuwien.ase.kotlin"
        version = "1.0.0"

        repositories.apply {
            add(mavenCentral())
        }

        dependencies.constraints {
            add("implementation", "io.quarkiverse.minio:quarkus-minio:3.8.1")
        }

        // Set Java toolchain to 17 for the project
        extensions.getByType<JavaPluginExtension>().toolchain {
            languageVersion.set(JavaLanguageVersion.of(21))
        }

        // Set Kotlin toolchain (optional but good for consistency)
        extensions.extraProperties["kotlin.jvmToolchain"] = 21

        extensions.extraProperties["kotlinVersion"] = "2.1.20"
    }
}