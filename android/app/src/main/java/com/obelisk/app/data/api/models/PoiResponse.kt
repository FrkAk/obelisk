package com.obelisk.app.data.api.models

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

/** Request body for POST /api/poi/lookup. */
@JsonClass(generateAdapter = true)
data class PoiLookupRequest(
    val name: String,
    val latitude: Double,
    val longitude: Double,
    val category: String? = null,
)

/**
 * Response from POST /api/poi/lookup.
 *
 * @property source Data source: "database", "nominatim", or "synthetic".
 */
@JsonClass(generateAdapter = true)
data class PoiLookupResponse(
    val poi: PoiDto,
    val remark: RemarkWithPoiDto? = null,
    val source: String,
)

/**
 * POI data transfer object matching the web ExternalPOI interface.
 *
 * @property id Composite identifier (e.g. "db-123", "nominatim-456", "synthetic-uuid").
 * @property source Data source: "database", "nominatim", or "synthetic".
 */
@JsonClass(generateAdapter = true)
data class PoiDto(
    val id: String,
    @Json(name = "osmId") val osmId: Long = 0,
    @Json(name = "osmType") val osmType: String = "node",
    val name: String,
    val category: String = "hidden",
    val latitude: Double,
    val longitude: Double,
    val address: String? = null,
    @Json(name = "openingHours") val openingHours: String? = null,
    val phone: String? = null,
    val website: String? = null,
    val cuisine: String? = null,
    @Json(name = "hasWifi") val hasWifi: Boolean? = null,
    @Json(name = "hasOutdoorSeating") val hasOutdoorSeating: Boolean? = null,
    val images: List<PoiImageDto>? = null,
    @Json(name = "mapillaryId") val mapillaryId: String? = null,
    @Json(name = "mapillaryBearing") val mapillaryBearing: Double? = null,
    @Json(name = "mapillaryIsPano") val mapillaryIsPano: Boolean? = null,
    @Json(name = "wikipediaUrl") val wikipediaUrl: String? = null,
    val source: String = "synthetic",
)

/** POI image data. */
@JsonClass(generateAdapter = true)
data class PoiImageDto(
    val id: String,
    val url: String,
    val source: String,
)

/**
 * Remark with nested POI data, matching the web RemarkWithPoi type.
 *
 * @property content Full remark body (markdown).
 * @property durationSeconds Estimated read duration in seconds.
 */
@JsonClass(generateAdapter = true)
data class RemarkWithPoiDto(
    val id: String,
    @Json(name = "poiId") val poiId: String,
    val title: String,
    val teaser: String? = null,
    val content: String,
    @Json(name = "localTip") val localTip: String? = null,
    @Json(name = "durationSeconds") val durationSeconds: Int? = null,
    val locale: String? = null,
    val version: Int = 1,
    @Json(name = "isCurrent") val isCurrent: Boolean? = null,
    val poi: RemarkPoiDto,
)

/** Minimal POI data nested inside a remark response. */
@JsonClass(generateAdapter = true)
data class RemarkPoiDto(
    val id: String,
    val name: String,
    val latitude: Double,
    val longitude: Double,
    val category: CategoryDto? = null,
)

/** Category data. */
@JsonClass(generateAdapter = true)
data class CategoryDto(
    val id: String,
    val name: String,
    val slug: String,
)
