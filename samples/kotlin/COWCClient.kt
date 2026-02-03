/**
 * COWC Kotlin Client
 *
 * A Kotlin client for integrating with COWC providers on Android.
 */

package com.cashku.cowc

import com.google.gson.Gson
import com.google.gson.annotations.SerializedName
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.IOException
import java.util.*
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

/**
 * COWC API Client
 */
class COWCClient(
    private val baseUrl: String,
    private val clientId: String,
    private val clientSecret: String,
    private val apiKey: String
) {
    private val httpClient = OkHttpClient()
    private val gson = Gson()
    private val jsonMediaType = "application/json".toMediaType()

    private var accessToken: String? = null
    private var tokenExpiry: Long? = null

    /**
     * Authenticate with the COWC provider
     */
    @Throws(COWCException::class)
    fun authenticate(scopes: List<String> = listOf("funds:read", "portfolio:read", "orders:write")): String {
        val formBody = FormBody.Builder()
            .add("grant_type", "client_credentials")
            .add("client_id", clientId)
            .add("client_secret", clientSecret)
            .add("scope", scopes.joinToString(" "))
            .build()

        val request = Request.Builder()
            .url("$baseUrl/oauth/token")
            .post(formBody)
            .build()

        val response = httpClient.newCall(request).execute()
        val body = response.body?.string() ?: throw COWCException("Empty response")

        if (!response.isSuccessful) {
            throw COWCException("Authentication failed: ${response.code}")
        }

        val tokenResponse = gson.fromJson(body, TokenResponse::class.java)
        accessToken = tokenResponse.accessToken
        tokenExpiry = System.currentTimeMillis() + (tokenResponse.expiresIn * 1000)

        return tokenResponse.accessToken
    }

    private val isTokenExpired: Boolean
        get() {
            val expiry = tokenExpiry ?: return true
            return System.currentTimeMillis() > expiry - 300_000 // 5 min buffer
        }

    private fun ensureAuthenticated() {
        if (isTokenExpired) {
            authenticate()
        }
    }

    private inline fun <reified T> request(
        method: String,
        endpoint: String,
        queryParams: Map<String, String>? = null,
        body: Any? = null
    ): T {
        ensureAuthenticated()

        val urlBuilder = "$baseUrl$endpoint".toHttpUrl().newBuilder()
        queryParams?.forEach { (key, value) ->
            urlBuilder.addQueryParameter(key, value)
        }

        val requestBuilder = Request.Builder()
            .url(urlBuilder.build())
            .addHeader("Authorization", "Bearer $accessToken")
            .addHeader("X-COWC-Partner-Key", apiKey)
            .addHeader("X-COWC-Request-ID", UUID.randomUUID().toString())
            .addHeader("Content-Type", "application/json")

        when (method) {
            "GET" -> requestBuilder.get()
            "POST" -> requestBuilder.post(
                gson.toJson(body).toRequestBody(jsonMediaType)
            )
            "DELETE" -> requestBuilder.delete()
        }

        val response = httpClient.newCall(requestBuilder.build()).execute()
        val responseBody = response.body?.string() ?: throw COWCException("Empty response")

        if (!response.isSuccessful) {
            val errorResponse = try {
                gson.fromJson(responseBody, ErrorResponse::class.java)
            } catch (e: Exception) {
                null
            }
            throw COWCException(
                message = errorResponse?.error?.message ?: "Request failed",
                code = errorResponse?.error?.code,
                status = response.code
            )
        }

        return gson.fromJson(responseBody, T::class.java)
    }

    // Fund Discovery

    fun listFunds(
        category: String? = null,
        riskLevel: String? = null,
        isShariah: Boolean? = null,
        limit: Int? = null,
        offset: Int? = null
    ): FundsResponse {
        val params = mutableMapOf<String, String>()
        category?.let { params["category"] = it }
        riskLevel?.let { params["risk_level"] = it }
        isShariah?.let { params["is_shariah"] = it.toString() }
        limit?.let { params["limit"] = it.toString() }
        offset?.let { params["offset"] = it.toString() }

        return request("GET", "/funds", if (params.isNotEmpty()) params else null)
    }

    fun getFund(fundId: String): Fund {
        return request("GET", "/funds/$fundId")
    }

    // Portfolio

    fun getPortfolio(bindingId: String): Portfolio {
        return request("GET", "/bindings/$bindingId/portfolio")
    }

    fun getHoldings(bindingId: String): HoldingsResponse {
        return request("GET", "/bindings/$bindingId/holdings")
    }

    // Flows

    fun initiateOnboarding(
        partnerUserId: String,
        email: String? = null,
        phone: String? = null,
        callbackUrl: String,
        locale: String = "en"
    ): FlowResponse {
        val body = mutableMapOf<String, Any>(
            "partner_user_id" to partnerUserId,
            "callback_url" to callbackUrl,
            "locale" to locale
        )
        email?.let { body["email"] = it }
        phone?.let { body["phone"] = it }

        return request("POST", "/flows/onboarding", body = body)
    }

    // Orders

    fun previewOrder(
        bindingId: String,
        fundId: String,
        amount: Double,
        orderType: String = "subscription",
        currency: String = "MYR"
    ): OrderPreview {
        return request("POST", "/orders/preview", body = mapOf(
            "binding_id" to bindingId,
            "fund_id" to fundId,
            "order_type" to orderType,
            "amount" to amount,
            "currency" to currency
        ))
    }

    fun createOrder(
        bindingId: String,
        fundId: String,
        amount: Double,
        orderType: String = "subscription",
        currency: String = "MYR",
        partnerReferenceId: String? = null
    ): Order {
        val body = mutableMapOf<String, Any>(
            "binding_id" to bindingId,
            "fund_id" to fundId,
            "order_type" to orderType,
            "amount" to amount,
            "currency" to currency
        )
        partnerReferenceId?.let { body["partner_reference_id"] = it }

        return request("POST", "/orders", body = body)
    }

    fun getOrder(orderId: String): Order {
        return request("GET", "/orders/$orderId")
    }
}

// Models

data class TokenResponse(
    @SerializedName("access_token") val accessToken: String,
    @SerializedName("token_type") val tokenType: String,
    @SerializedName("expires_in") val expiresIn: Int,
    val scope: String
)

data class FundsResponse(
    val funds: List<Fund>,
    val pagination: Pagination
)

data class Fund(
    @SerializedName("fund_id") val fundId: String,
    @SerializedName("fund_code") val fundCode: String,
    @SerializedName("fund_name") val fundName: String,
    val category: String,
    @SerializedName("risk_level") val riskLevel: String,
    @SerializedName("current_nav") val currentNav: Double,
    val currency: String
)

data class Pagination(
    val total: Int,
    val limit: Int,
    val offset: Int
)

data class Portfolio(
    @SerializedName("total_value") val totalValue: MoneyAmount,
    @SerializedName("total_invested") val totalInvested: MoneyAmount,
    @SerializedName("total_returns") val totalReturns: Returns
)

data class MoneyAmount(
    val amount: Double,
    val currency: String
)

data class Returns(
    val amount: Double,
    val percent: Double
)

data class HoldingsResponse(
    val holdings: List<Holding>
)

data class Holding(
    @SerializedName("fund_id") val fundId: String,
    @SerializedName("fund_name") val fundName: String,
    val units: Double,
    @SerializedName("market_value") val marketValue: Double,
    @SerializedName("unrealized_gain_percent") val unrealizedGainPercent: Double
)

data class FlowResponse(
    @SerializedName("flow_id") val flowId: String,
    @SerializedName("flow_url") val flowUrl: String,
    @SerializedName("expires_at") val expiresAt: String
)

data class OrderPreview(
    @SerializedName("gross_amount") val grossAmount: Double,
    @SerializedName("sales_charge") val salesCharge: Double,
    @SerializedName("net_amount") val netAmount: Double,
    @SerializedName("indicative_units") val indicativeUnits: Double
)

data class Order(
    @SerializedName("order_id") val orderId: String,
    val status: String,
    @SerializedName("payment_flow") val paymentFlow: PaymentFlow?
)

data class PaymentFlow(
    @SerializedName("flow_url") val flowUrl: String,
    @SerializedName("expires_at") val expiresAt: String
)

data class ErrorResponse(
    val error: ApiError
)

data class ApiError(
    val code: String?,
    val message: String
)

class COWCException(
    message: String,
    val code: String? = null,
    val status: Int? = null
) : Exception(message)

// Webhook Verification

fun verifyWebhook(payload: String, signature: String, timestamp: String, secret: String, maxAge: Int = 300): Boolean {
    val ts = timestamp.toLongOrNull() ?: return false
    val now = System.currentTimeMillis() / 1000

    if (kotlin.math.abs(now - ts) > maxAge) return false

    val signedPayload = "$timestamp.$payload"
    val mac = Mac.getInstance("HmacSHA256")
    mac.init(SecretKeySpec(secret.toByteArray(), "HmacSHA256"))
    val hash = mac.doFinal(signedPayload.toByteArray())
    val expected = "sha256=" + hash.joinToString("") { "%02x".format(it) }

    return signature == expected
}

// Extension to convert String to HttpUrl
private fun String.toHttpUrl() = okhttp3.HttpUrl.Builder()
    .scheme(if (this.startsWith("https")) "https" else "http")
    .host(this.substringAfter("://").substringBefore("/").substringBefore(":"))
    .apply {
        val portStr = this@toHttpUrl.substringAfter("://").substringBefore("/").substringAfter(":", "")
        if (portStr.isNotEmpty()) port(portStr.toInt())
    }
    .encodedPath(this.substringAfter("://").substringAfter("/", "/").let { if (it.startsWith("/")) it else "/$it" })
    .build()
