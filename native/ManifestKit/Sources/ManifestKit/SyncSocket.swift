import Foundation

/// One connection to the Worker's /ws. A stub URL protocol cannot stand in for a WebSocket, so
/// the glue below gets a live check only (debt native-sync-live-unrun).
public protocol SyncSocket: Sendable {
    /// One connection to /ws with the protocols ["mailaudit", key]. Calls `opened` when the handshake
    /// succeeds and `message` for each text frame. Returns when the connection ends for any reason:
    /// a failed open, a close, or a cancel.
    func run(key: String, opened: @escaping @Sendable () -> Void, message: @escaping @Sendable (String) -> Void) async
}

public enum SyncSocketSpec {
    /// https becomes wss, http becomes ws, and the path is /ws. The key is never in it.
    public static func endpoint(_ base: URL) -> URL {
        let url = base.appending(path: "ws")
        guard var c = URLComponents(url: url, resolvingAgainstBaseURL: false) else { return url }
        c.scheme = base.scheme == "http" ? "ws" : "wss"
        return c.url ?? url
    }

    /// The two WebSocket protocols the Worker expects: "mailaudit", then the key. A browser cannot
    /// set a header on a WebSocket, so the key rides as the second protocol.
    public static func protocols(key: String) -> [String] { ["mailaudit", key] }
}

/// URLSessionWebSocketTask behind SyncSocket. It has its own session, because the handshake callback
/// belongs to a session delegate.
public struct URLSessionSyncSocket: SyncSocket {
    private let baseURL: URL

    public init(baseURL: URL) { self.baseURL = baseURL }

    public func run(key: String, opened: @escaping @Sendable () -> Void, message: @escaping @Sendable (String) -> Void) async {
        let watcher = OpenWatcher(opened)
        let session = URLSession(configuration: .ephemeral, delegate: watcher, delegateQueue: nil)
        defer { session.invalidateAndCancel() }
        let task = session.webSocketTask(with: SyncSocketSpec.endpoint(baseURL), protocols: SyncSocketSpec.protocols(key: key))
        await withTaskCancellationHandler {
            task.resume()
            while !Task.isCancelled, let frame = try? await task.receive() {
                if case .string(let text) = frame { message(text) }
            }
        } onCancel: {
            task.cancel(with: .goingAway, reason: nil)
        }
        task.cancel(with: .goingAway, reason: nil)
    }

    private final class OpenWatcher: NSObject, URLSessionWebSocketDelegate, @unchecked Sendable {
        let opened: @Sendable () -> Void
        init(_ opened: @escaping @Sendable () -> Void) { self.opened = opened }
        func urlSession(_ s: URLSession, webSocketTask: URLSessionWebSocketTask, didOpenWithProtocol p: String?) { opened() }
    }
}
