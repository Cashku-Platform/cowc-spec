/// COWC Swift Client
///
/// A Swift client for integrating with COWC providers on iOS.

import Foundation
import CryptoKit

/// COWC API Client
public class COWCClient {
    private let baseUrl: String
    private let clientId: String
    private let clientSecret: String
    private let apiKey: String

    private var accessToken: String?
    private var tokenExpiry: Date?

    public init(baseUrl: String, clientId: String, clientSecret: String, apiKey: String) {
        self.baseUrl = baseUrl.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        self.clientId = clientId
        self.clientSecret = clientSecret
        self.apiKey = apiKey
    }

    // MARK: - Authentication

    /// Authenticate with the COWC provider
    public func authenticate(scopes: [String] = ["funds:read", "portfolio:read", "orders:write"]) async throws -> String {
        var request = URLRequest(url: URL(string: "\(baseUrl)/oauth/token")!)
        request.httpMethod = "POST"
        request.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")

        let body = [
            "grant_type": "client_credentials",
            "client_id": clientId,
            "client_secret": clientSecret,
            "scope": scopes.joined(separator: " ")
        ]
        request.httpBody = body.map { "\($0.key)=\($0.value)" }.joined(separator: "&").data(using: .utf8)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            throw COWCError.authenticationFailed
        }

        let result = try JSONDecoder().decode(TokenResponse.self, from: data)
        self.accessToken = result.accessToken
        self.tokenExpiry = Date().addingTimeInterval(TimeInterval(result.expiresIn))

        return result.accessToken
    }

    private var isTokenExpired: Bool {
        guard let expiry = tokenExpiry else { return true }
        return Date() > expiry.addingTimeInterval(-300) // 5 min buffer
    }

    private func ensureAuthenticated() async throws {
        if isTokenExpired {
            _ = try await authenticate()
        }
    }

    // MARK: - Request

    private func request<T: Decodable>(
        method: String,
        endpoint: String,
        queryParams: [String: String]? = nil,
        body: [String: Any]? = nil
    ) async throws -> T {
        try await ensureAuthenticated()

        var urlComponents = URLComponents(string: "\(baseUrl)\(endpoint)")!
        if let params = queryParams {
            urlComponents.queryItems = params.map { URLQueryItem(name: $0.key, value: $0.value) }
        }

        var request = URLRequest(url: urlComponents.url!)
        request.httpMethod = method
        request.setValue("Bearer \(accessToken!)", forHTTPHeaderField: "Authorization")
        request.setValue(apiKey, forHTTPHeaderField: "X-COWC-Partner-Key")
        request.setValue(UUID().uuidString, forHTTPHeaderField: "X-COWC-Request-ID")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if let body = body {
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
        }

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw COWCError.invalidResponse
        }

        if httpResponse.statusCode >= 400 {
            if let errorResponse = try? JSONDecoder().decode(ErrorResponse.self, from: data) {
                throw COWCError.apiError(
                    message: errorResponse.error.message,
                    code: errorResponse.error.code,
                    status: httpResponse.statusCode
                )
            }
            throw COWCError.requestFailed(statusCode: httpResponse.statusCode)
        }

        return try JSONDecoder().decode(T.self, from: data)
    }

    // MARK: - Fund Discovery

    /// List available funds
    public func listFunds(
        category: String? = nil,
        riskLevel: String? = nil,
        isShariah: Bool? = nil,
        limit: Int? = nil,
        offset: Int? = nil
    ) async throws -> FundsResponse {
        var params: [String: String] = [:]
        if let category = category { params["category"] = category }
        if let riskLevel = riskLevel { params["risk_level"] = riskLevel }
        if let isShariah = isShariah { params["is_shariah"] = String(isShariah) }
        if let limit = limit { params["limit"] = String(limit) }
        if let offset = offset { params["offset"] = String(offset) }

        return try await request(method: "GET", endpoint: "/funds", queryParams: params.isEmpty ? nil : params)
    }

    /// Get fund details
    public func getFund(fundId: String) async throws -> Fund {
        return try await request(method: "GET", endpoint: "/funds/\(fundId)")
    }

    // MARK: - Portfolio

    /// Get portfolio summary
    public func getPortfolio(bindingId: String) async throws -> Portfolio {
        return try await request(method: "GET", endpoint: "/bindings/\(bindingId)/portfolio")
    }

    /// Get holdings
    public func getHoldings(bindingId: String) async throws -> HoldingsResponse {
        return try await request(method: "GET", endpoint: "/bindings/\(bindingId)/holdings")
    }

    // MARK: - Flows

    /// Initiate onboarding flow
    public func initiateOnboarding(
        partnerUserId: String,
        email: String? = nil,
        phone: String? = nil,
        callbackUrl: String,
        locale: String = "en"
    ) async throws -> FlowResponse {
        var body: [String: Any] = [
            "partner_user_id": partnerUserId,
            "callback_url": callbackUrl,
            "locale": locale
        ]
        if let email = email { body["email"] = email }
        if let phone = phone { body["phone"] = phone }

        return try await request(method: "POST", endpoint: "/flows/onboarding", body: body)
    }

    // MARK: - Orders

    /// Preview order
    public func previewOrder(
        bindingId: String,
        fundId: String,
        amount: Double,
        orderType: String = "subscription",
        currency: String = "MYR"
    ) async throws -> OrderPreview {
        return try await request(method: "POST", endpoint: "/orders/preview", body: [
            "binding_id": bindingId,
            "fund_id": fundId,
            "order_type": orderType,
            "amount": amount,
            "currency": currency
        ])
    }

    /// Create order
    public func createOrder(
        bindingId: String,
        fundId: String,
        amount: Double,
        orderType: String = "subscription",
        currency: String = "MYR",
        partnerReferenceId: String? = nil
    ) async throws -> Order {
        var body: [String: Any] = [
            "binding_id": bindingId,
            "fund_id": fundId,
            "order_type": orderType,
            "amount": amount,
            "currency": currency
        ]
        if let refId = partnerReferenceId { body["partner_reference_id"] = refId }

        return try await request(method: "POST", endpoint: "/orders", body: body)
    }
}

// MARK: - Models

public struct TokenResponse: Decodable {
    let accessToken: String
    let tokenType: String
    let expiresIn: Int
    let scope: String

    enum CodingKeys: String, CodingKey {
        case accessToken = "access_token"
        case tokenType = "token_type"
        case expiresIn = "expires_in"
        case scope
    }
}

public struct FundsResponse: Decodable {
    public let funds: [Fund]
    public let pagination: Pagination
}

public struct Fund: Decodable {
    public let fundId: String
    public let fundCode: String
    public let fundName: String
    public let category: String
    public let riskLevel: String
    public let currentNav: Double
    public let currency: String

    enum CodingKeys: String, CodingKey {
        case fundId = "fund_id"
        case fundCode = "fund_code"
        case fundName = "fund_name"
        case category
        case riskLevel = "risk_level"
        case currentNav = "current_nav"
        case currency
    }
}

public struct Pagination: Decodable {
    public let total: Int
    public let limit: Int
    public let offset: Int
}

public struct Portfolio: Decodable {
    public let totalValue: MoneyAmount
    public let totalInvested: MoneyAmount
    public let totalReturns: Returns

    enum CodingKeys: String, CodingKey {
        case totalValue = "total_value"
        case totalInvested = "total_invested"
        case totalReturns = "total_returns"
    }
}

public struct MoneyAmount: Decodable {
    public let amount: Double
    public let currency: String
}

public struct Returns: Decodable {
    public let amount: Double
    public let percent: Double
}

public struct HoldingsResponse: Decodable {
    public let holdings: [Holding]
}

public struct Holding: Decodable {
    public let fundId: String
    public let fundName: String
    public let units: Double
    public let marketValue: Double
    public let unrealizedGainPercent: Double

    enum CodingKeys: String, CodingKey {
        case fundId = "fund_id"
        case fundName = "fund_name"
        case units
        case marketValue = "market_value"
        case unrealizedGainPercent = "unrealized_gain_percent"
    }
}

public struct FlowResponse: Decodable {
    public let flowId: String
    public let flowUrl: String
    public let expiresAt: String

    enum CodingKeys: String, CodingKey {
        case flowId = "flow_id"
        case flowUrl = "flow_url"
        case expiresAt = "expires_at"
    }
}

public struct OrderPreview: Decodable {
    public let grossAmount: Double
    public let salesCharge: Double
    public let netAmount: Double
    public let indicativeUnits: Double

    enum CodingKeys: String, CodingKey {
        case grossAmount = "gross_amount"
        case salesCharge = "sales_charge"
        case netAmount = "net_amount"
        case indicativeUnits = "indicative_units"
    }
}

public struct Order: Decodable {
    public let orderId: String
    public let status: String
    public let paymentFlow: PaymentFlow?

    enum CodingKeys: String, CodingKey {
        case orderId = "order_id"
        case status
        case paymentFlow = "payment_flow"
    }
}

public struct PaymentFlow: Decodable {
    public let flowUrl: String
    public let expiresAt: String

    enum CodingKeys: String, CodingKey {
        case flowUrl = "flow_url"
        case expiresAt = "expires_at"
    }
}

public struct ErrorResponse: Decodable {
    let error: APIError

    struct APIError: Decodable {
        let code: String?
        let message: String
    }
}

// MARK: - Errors

public enum COWCError: Error {
    case authenticationFailed
    case invalidResponse
    case requestFailed(statusCode: Int)
    case apiError(message: String, code: String?, status: Int)
}

// MARK: - Webhook Verification

public func verifyWebhook(payload: String, signature: String, timestamp: String, secret: String, maxAge: Int = 300) -> Bool {
    guard let ts = Int(timestamp) else { return false }
    let now = Int(Date().timeIntervalSince1970)

    if abs(now - ts) > maxAge { return false }

    let signedPayload = "\(timestamp).\(payload)"
    let key = SymmetricKey(data: Data(secret.utf8))
    let mac = HMAC<SHA256>.authenticationCode(for: Data(signedPayload.utf8), using: key)
    let expected = "sha256=" + mac.map { String(format: "%02x", $0) }.joined()

    return signature == expected
}
