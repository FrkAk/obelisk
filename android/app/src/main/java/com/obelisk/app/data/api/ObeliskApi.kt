package com.obelisk.app.data.api

import com.obelisk.app.data.api.models.PoiLookupRequest
import com.obelisk.app.data.api.models.PoiLookupResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST

/**
 * Retrofit interface for the Obelisk Next.js API.
 */
interface ObeliskApi {

    /**
     * Looks up a POI by name and coordinates, returning enriched data with optional remark.
     *
     * @param request POI name, lat/lon, and optional category hint.
     * @return Retrofit Response wrapping the lookup result.
     */
    @POST("/api/poi/lookup")
    suspend fun lookupPoi(@Body request: PoiLookupRequest): Response<PoiLookupResponse>
}
