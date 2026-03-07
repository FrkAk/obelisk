package com.obelisk.app

import android.app.Application
import com.mapbox.common.MapboxOptions
import dagger.hilt.android.HiltAndroidApp

/** Hilt application entry point. Sets Mapbox access token on startup. */
@HiltAndroidApp
class ObeliskApp : Application() {
    /** Sets Mapbox access token from build configuration on app startup. */
    override fun onCreate() {
        super.onCreate()
        MapboxOptions.accessToken = BuildConfig.MAPBOX_ACCESS_TOKEN
    }
}
