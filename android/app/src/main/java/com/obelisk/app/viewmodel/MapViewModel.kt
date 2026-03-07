package com.obelisk.app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.obelisk.app.data.api.models.PoiDto
import com.obelisk.app.data.api.models.RemarkWithPoiDto
import com.obelisk.app.data.repository.PoiRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.concurrent.atomic.AtomicInteger
import javax.inject.Inject

/**
 * Manages map POI selection state and lookup flow.
 * Mirrors the web page.tsx handlePoiClick logic:
 * 1. Set synthetic pending POI immediately for responsiveness.
 * 2. Call /api/poi/lookup to replace with enriched data.
 * 3. If remark exists, store it.
 *
 * @param poiRepository Repository for POI API calls.
 */
@HiltViewModel
class MapViewModel @Inject constructor(
    private val poiRepository: PoiRepository,
) : ViewModel() {

    private val _selectedPoi = MutableStateFlow<PoiDto?>(null)
    /** Currently selected POI, null when nothing selected. */
    val selectedPoi: StateFlow<PoiDto?> = _selectedPoi.asStateFlow()

    private val _selectedRemark = MutableStateFlow<RemarkWithPoiDto?>(null)
    /** Remark associated with the selected POI, null if none. */
    val selectedRemark: StateFlow<RemarkWithPoiDto?> = _selectedRemark.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    /** Whether a POI lookup is in progress. */
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val clickSeq = AtomicInteger(0)
    private var lookupJob: Job? = null

    /**
     * Handles a POI click from the map. Sets a synthetic pending POI immediately,
     * then fetches enriched data from the API.
     *
     * @param name POI name from Mapbox feature.
     * @param latitude POI latitude.
     * @param longitude POI longitude.
     * @param category Optional category hint.
     */
    fun onPoiClicked(name: String, latitude: Double, longitude: Double, category: String? = null) {
        val seq = clickSeq.incrementAndGet()

        _selectedRemark.value = null
        _selectedPoi.value = PoiDto(
            id = "pending-$seq",
            name = name,
            latitude = latitude,
            longitude = longitude,
            category = category ?: "other",
            source = "synthetic",
        )
        _isLoading.value = true

        lookupJob?.cancel()
        lookupJob = viewModelScope.launch {
            val result = poiRepository.lookupPoi(name, latitude, longitude, category)

            if (clickSeq.get() != seq) return@launch

            if (result != null) {
                _selectedPoi.value = result.poi
                _selectedRemark.value = result.remark
            } else {
                _selectedPoi.value = null
                _selectedRemark.value = null
            }
            _isLoading.value = false
        }
    }

    /**
     * Clears the current POI selection.
     */
    fun clearSelection() {
        clickSeq.incrementAndGet()
        lookupJob?.cancel()
        _selectedPoi.value = null
        _selectedRemark.value = null
        _isLoading.value = false
    }
}
