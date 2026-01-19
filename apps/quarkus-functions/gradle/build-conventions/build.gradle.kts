plugins {
    `kotlin-dsl`
    `java-gradle-plugin`
}

gradlePlugin {
    plugins {
        register("knativeFuncConvention") {
            id = "at.ac.tuwien.ase.knative-func"
            implementationClass = "KnativeFuncConventionPlugin"
        }
        register("kotlinConventinos") {
            id = "at.ac.tuwien.ase.kotlin"
            implementationClass = "KotlinConventionPlugin"
        }
    }
}

repositories {
    mavenCentral()
    gradlePluginPortal()
}

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(21))
    }
}

kotlin {
    jvmToolchain(21)
}

dependencies {
    implementation("org.jetbrains.kotlin.jvm:org.jetbrains.kotlin.jvm.gradle.plugin:2.1.20")
    implementation("io.quarkus:io.quarkus.gradle.plugin:3.21.3")
}