package com.obelisk.app.data.location

import android.annotation.SuppressLint
import android.location.Location
import android.os.Looper
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.Priority
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Provides a reactive stream of device location updates via the fused location provider.
 *
 * @param client FusedLocationProviderClient injected by Hilt.
 */
@Singleton
class LocationRepository @Inject constructor(
    private val client: FusedLocationProviderClient,
) {
    /**
     * Emits location updates at balanced accuracy (~5s interval).
     * Callers must verify ACCESS_FINE_LOCATION permission at runtime before collecting.
     *
     * @return Flow of [Location] updates.
     */
    @SuppressLint("MissingPermission")
    fun locationFlow(): Flow<Location> = callbackFlow {
        val request = LocationRequest.Builder(
            Priority.PRIORITY_BALANCED_POWER_ACCURACY,
            5_000L,
        ).setMinUpdateDistanceMeters(5f).build()

        val callback = object : LocationCallback() {
            override fun onLocationResult(result: LocationResult) {
                result.lastLocation?.let { trySend(it) }
            }
        }

        client.requestLocationUpdates(request, callback, Looper.getMainLooper())
        awaitClose { client.removeLocationUpdates(callback) }
    }
}
