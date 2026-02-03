# COWC Swift Sample

A Swift implementation example for integrating with COWC providers on iOS.

## Requirements

- iOS 15.0+
- Xcode 14+
- Swift 5.7+

## Installation

### Swift Package Manager

Add to your `Package.swift`:

```swift
dependencies: [
    .package(url: "https://github.com/cashku/cowc-swift", from: "1.0.0")
]
```

Or add via Xcode: File > Add Packages...

## Usage

```swift
import COWCClient

let client = COWCClient(
    baseUrl: "https://staging.cashku.ai/cowc/v1",
    clientId: "your_client_id",
    clientSecret: "your_client_secret",
    apiKey: "your_api_key"
)

// Authenticate
try await client.authenticate()

// List funds
let funds = try await client.listFunds(category: "equity")

// Get portfolio
let portfolio = try await client.getPortfolio(bindingId: "bind_xxx")

// Initiate onboarding
let flow = try await client.initiateOnboarding(
    partnerUserId: "user_123",
    email: "user@example.com",
    callbackUrl: "myapp://cowc/callback"
)
// Open flow.flowUrl in WKWebView...
```

## WebView Integration

```swift
import WebKit

class COWCWebViewController: UIViewController, WKNavigationDelegate {
    var flowUrl: URL!
    var onComplete: ((String?) -> Void)?

    override func viewDidLoad() {
        super.viewDidLoad()
        let webView = WKWebView(frame: view.bounds)
        webView.navigationDelegate = self
        view.addSubview(webView)
        webView.load(URLRequest(url: flowUrl))
    }

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction) async -> WKNavigationActionPolicy {
        guard let url = navigationAction.request.url,
              url.scheme == "myapp" else {
            return .allow
        }

        let components = URLComponents(url: url, resolvingAgainstBaseURL: false)
        let bindingId = components?.queryItems?.first(where: { $0.name == "binding_id" })?.value

        onComplete?(bindingId)
        dismiss(animated: true)

        return .cancel
    }
}
```

## License

Apache 2.0
