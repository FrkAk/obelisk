package com.obelisk.app.data.location

import android.content.Context
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationServices
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

/** Hilt module providing location services. */
@Module
@InstallIn(SingletonComponent::class)
object LocationModule {

    /**
     * Provides the fused location provider client.
     *
     * @param context Application context.
     * @return FusedLocationProviderClient instance.
     */
    @Provides
    @Singleton
    fun provideFusedLocationClient(
        @ApplicationContext context: Context,
    ): FusedLocationProviderClient = LocationServices.getFusedLocationProviderClient(context)
}
