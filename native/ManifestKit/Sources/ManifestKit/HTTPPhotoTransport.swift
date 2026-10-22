import Foundation

/// PhotoTransport over the Worker /photos route, as the web does (src/entry.jsx photoList, photoGet,
/// photoPut). Each call reads the key from the KeyStore when it is made. The type of a photo comes
/// from its name through mimeFromName in the rules bundle (rules-run-in-javascriptcore).
public struct HTTPPhotoTransport: PhotoTransport {
    private let link: WorkerLink
    private let keys: KeyStore
    private let engine: RulesEngine

    public init(baseURL: URL, session: URLSession, keys: KeyStore, engine: RulesEngine) {
        link = WorkerLink(baseURL: baseURL, session: session, engine: engine)
        self.keys = keys
        self.engine = engine
    }

    /// File names as the Worker lists them. Nil is "the Worker could not say", never an empty list
    /// (listphotos-is-three-valued).
    public func list() async throws -> [String]? {
        guard case .answered("ok", let data)? = try await call("GET", "photos"),
              let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let ids = obj["ids"] as? [String] else { return nil }
        return ids
    }

    /// A 413 is `.tooLarge`, the one failure PhotoSync steps over. Any other failure throws.
    public func put(name: String, data: Data) async throws {
        let type = try await mime(of: name)
        switch try await call("POST", "photos/\(name)", body: data, type: type) {
        case .answered("ok", _)?: return
        case .answered("too-big", _)?: throw PhotoTransportError.tooLarge
        default: throw URLError(.badServerResponse)
        }
    }

    /// Nil on a 404. Any other failure throws, so a Worker that is down is not read as a missing photo.
    public func get(name: String) async throws -> Data? {
        switch try await call("GET", "photos/\(name)") {
        case .answered("ok", let data)?: return data
        case .answered("empty", _)?: return nil
        default: throw URLError(.badServerResponse)
        }
    }

    /// Nil when there is no key or the Worker did not answer. A cancel throws.
    private func call(_ method: String, _ path: String, body: Data? = nil, type: String? = nil) async throws -> WorkerLink.Result? {
        guard let key = (try? keys.key()) ?? nil else { return nil }
        let result = await link.send(key: key, method: method, path: path, body: body, contentType: type)
        if case .stopped = result { throw CancellationError() }
        if case .unreachable = result { return nil }
        return result
    }

    private func mime(of name: String) async throws -> String {
        let arg = String(decoding: try JSONSerialization.data(withJSONObject: [name]), as: UTF8.self)
        let out = try await engine.call("mimeFromName", arg)
        guard let type = try JSONSerialization.jsonObject(with: Data(out.utf8), options: .fragmentsAllowed) as? String else {
            throw URLError(.cannotParseResponse)
        }
        return type
    }
}
