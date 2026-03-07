plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.ksp)
    alias(libs.plugins.hilt)
}

android {
    namespace = "com.obelisk.app"
    compileSdk {
        version = release(36) {
            minorApiLevel = 1
        }
    }

    defaultConfig {
        applicationId = "com.obelisk.app"
        minSdk = 31
        targetSdk = 36
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

        // Read root .env for Mapbox tokens and styles
        val envMap = mutableMapOf<String, String>()
        rootProject.file("../.env").takeIf { it.exists() }?.readLines()?.forEach { line ->
            val trimmed = line.trim()
            if (trimmed.isNotEmpty() && !trimmed.startsWith("#") && '=' in trimmed) {
                envMap[trimmed.substringBefore("=")] = trimmed.substringAfter("=")
            }
        }
        fun env(key: String): String = envMap[key] ?: System.getenv(key) ?: ""

        buildConfigField("String", "MAPBOX_ACCESS_TOKEN", "\"${env("NEXT_PUBLIC_MAPBOX_TOKEN")}\"")
        buildConfigField("String", "MAPBOX_STYLE_LIGHT", "\"${env("NEXT_PUBLIC_MAPBOX_STYLE_LIGHT")}\"")
        buildConfigField("String", "MAPBOX_STYLE_DARK", "\"${env("NEXT_PUBLIC_MAPBOX_STYLE_DARK")}\"")

    }

    buildTypes {
        debug {
            buildConfigField("String", "API_BASE_URL", "\"http://10.0.2.2:3000\"")
        }
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            buildConfigField("String", "API_BASE_URL", "\"https://obelisk.obeliskark.com\"")
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
    buildFeatures {
        compose = true
        buildConfig = true
    }
}

dependencies {
    // Core
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.activity.compose)

    // Compose
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.graphics)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.compose.material3)
    implementation(libs.androidx.compose.foundation)
    implementation(libs.androidx.compose.material.icons.extended)

    // Lifecycle
    implementation(libs.androidx.lifecycle.runtime.compose)
    implementation(libs.androidx.lifecycle.viewmodel.compose)

    // Hilt
    implementation(libs.hilt.android)
    ksp(libs.hilt.compiler)
    implementation(libs.hilt.navigation.compose)

    // Mapbox
    implementation(libs.mapbox.maps)
    implementation(libs.mapbox.maps.compose)

    // Location
    implementation(libs.play.services.location)

    // Image
    implementation(libs.coil.compose)

    // Coroutines
    implementation(libs.kotlinx.coroutines.android)

    // Networking
    implementation(libs.retrofit)
    implementation(libs.retrofit.converter.moshi)
    implementation(libs.moshi.kotlin)
    ksp(libs.moshi.kotlin.codegen)
    implementation(libs.okhttp.logging)

    // Test
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(platform(libs.androidx.compose.bom))
    androidTestImplementation(libs.androidx.compose.ui.test.junit4)
    debugImplementation(libs.androidx.compose.ui.tooling)
    debugImplementation(libs.androidx.compose.ui.test.manifest)
}
