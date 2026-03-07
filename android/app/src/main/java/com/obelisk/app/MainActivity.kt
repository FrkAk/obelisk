package com.obelisk.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.obelisk.app.ui.map.MapScreen
import com.obelisk.app.ui.theme.ObeliskTheme
import dagger.hilt.android.AndroidEntryPoint

/** Single activity host for the Compose UI. */
@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    /** Sets up edge-to-edge display and composes the ObeliskTheme with MapScreen. */
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge(
            statusBarStyle = SystemBarStyle.auto(
                lightScrim = android.graphics.Color.argb(0x40, 0, 0, 0),
                darkScrim = android.graphics.Color.TRANSPARENT,
            ),
            navigationBarStyle = SystemBarStyle.auto(
                lightScrim = android.graphics.Color.argb(0x40, 0, 0, 0),
                darkScrim = android.graphics.Color.TRANSPARENT,
            ),
        )
        setContent {
            ObeliskTheme {
                MapScreen()
            }
        }
    }
}
