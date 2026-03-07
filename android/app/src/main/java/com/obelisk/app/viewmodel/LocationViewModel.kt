package com.obelisk.app.viewmodel

import android.location.Location
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.obelisk.app.data.location.LocationRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import javax.inject.Inject

/**
 * Exposes the device location as a [StateFlow] for composables.
 *
 * @param locationRepository Provides location updates.
 */
@HiltViewModel
class LocationViewModel @Inject constructor(
    locationRepository: LocationRepository,
) : ViewModel() {

    /** Current device location, null until first fix. */
    val location: StateFlow<Location?> = locationRepository.locationFlow()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000L), null)
}
