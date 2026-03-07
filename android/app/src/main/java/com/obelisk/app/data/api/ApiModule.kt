package com.obelisk.app.data.api

import com.obelisk.app.BuildConfig
import com.squareup.moshi.Moshi
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

/**
 * Hilt module providing networking dependencies: OkHttp, Moshi, Retrofit, and ObeliskApi.
 */
@Module
@InstallIn(SingletonComponent::class)
object ApiModule {

    /**
     * Provides a singleton Moshi instance with Kotlin support.
     *
     * @return Configured Moshi instance.
     */
    @Provides
    @Singleton
    fun provideMoshi(): Moshi = Moshi.Builder().build()

    /**
     * Provides a singleton OkHttpClient with logging (debug only) and timeouts.
     *
     * @return Configured OkHttpClient.
     */
    @Provides
    @Singleton
    fun provideOkHttpClient(): OkHttpClient {
        val builder = OkHttpClient.Builder()
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(15, TimeUnit.SECONDS)

        if (BuildConfig.DEBUG) {
            val logging = HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BODY
            }
            builder.addInterceptor(logging)
        }

        return builder.build()
    }

    /**
     * Provides a singleton Retrofit instance targeting the API base URL.
     *
     * @param client OkHttpClient for network calls.
     * @param moshi Moshi for JSON serialization.
     * @return Configured Retrofit instance.
     */
    @Provides
    @Singleton
    fun provideRetrofit(client: OkHttpClient, moshi: Moshi): Retrofit = Retrofit.Builder()
        .baseUrl(BuildConfig.API_BASE_URL)
        .client(client)
        .addConverterFactory(MoshiConverterFactory.create(moshi))
        .build()

    /**
     * Provides a singleton ObeliskApi implementation.
     *
     * @param retrofit Retrofit instance for creating the API interface.
     * @return ObeliskApi implementation.
     */
    @Provides
    @Singleton
    fun provideObeliskApi(retrofit: Retrofit): ObeliskApi =
        retrofit.create(ObeliskApi::class.java)
}
