# COWC Kotlin Sample

A Kotlin implementation example for integrating with COWC providers on Android.

## Requirements

- Android SDK 24+
- Kotlin 1.8+

## Installation

Add to your `build.gradle`:

```groovy
dependencies {
    implementation 'com.squareup.okhttp3:okhttp:4.12.0'
    implementation 'com.google.code.gson:gson:2.10.1'
    implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3'
}
```

## Usage

```kotlin
val client = COWCClient(
    baseUrl = "https://staging.cashku.ai/cowc/v1",
    clientId = "your_client_id",
    clientSecret = "your_client_secret",
    apiKey = "your_api_key"
)

// Authenticate
client.authenticate()

// List funds
val funds = client.listFunds(category = "equity")

// Get portfolio
val portfolio = client.getPortfolio("bind_xxx")

// Initiate onboarding
val flow = client.initiateOnboarding(
    partnerUserId = "user_123",
    email = "user@example.com",
    callbackUrl = "myapp://cowc/callback"
)
// Open flow.flowUrl in WebView...
```

## WebView Integration

```kotlin
class COWCWebViewActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(view: WebView, url: String): Boolean {
                    if (url.startsWith("myapp://cowc/callback")) {
                        val uri = Uri.parse(url)
                        val bindingId = uri.getQueryParameter("binding_id")
                        // Handle bindingId
                        setResult(Activity.RESULT_OK, Intent().putExtra("binding_id", bindingId))
                        finish()
                        return true
                    }
                    return false
                }
            }
        }

        setContentView(webView)
        webView.loadUrl(intent.getStringExtra("flow_url")!!)
    }
}
```

## License

Apache 2.0
