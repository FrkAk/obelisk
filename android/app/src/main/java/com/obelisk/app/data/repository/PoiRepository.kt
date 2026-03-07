package com.obelisk.app.data.repository

import android.util.Log
import com.obelisk.app.data.api.ObeliskApi
import com.obelisk.app.data.api.models.PoiLookupRequest
import com.obelisk.app.data.api.models.PoiLookupResponse
import java.util.concurrent.CancellationException
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Repository for POI data operations.
 *
 * @param api Obelisk API interface.
 */
@Singleton
class PoiRepository @Inject constructor(
    private val api: ObeliskApi,
) {

    /**
     * Looks up a POI by name and coordinates, returning enriched data with optional remark.
     *
     * @param name POI name.
     * @param latitude POI latitude.
     * @param longitude POI longitude.
     * @param category Optional category hint.
     * @return Lookup response or null on failure.
     */
    suspend fun lookupPoi(
        name: String,
        latitude: Double,
        longitude: Double,
        category: String? = null,
    ): PoiLookupResponse? {
        return try {
            val response = api.lookupPoi(
                PoiLookupRequest(
                    name = name,
                    latitude = latitude,
                    longitude = longitude,
                    category = category,
                )
            )
            if (response.isSuccessful) {
                response.body()
            } else {
                Log.w(TAG, "POI lookup failed for \"$name\": ${response.code()} ${response.message()}")
                null
            }
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            Log.e(TAG, "POI lookup error for \"$name\"", e)
            null
        }
    }

    companion object {
        private const val TAG = "PoiRepository"
    }
}
