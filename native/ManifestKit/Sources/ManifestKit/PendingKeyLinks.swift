import Foundation

/// Holds manifestledger:// links that arrive before the rules engine is ready, then
/// applies each once through KeyIntake. The queue empties as it drains, so it never
/// keeps a key (the-token-is-a-credential).
public actor PendingKeyLinks {
    private var links: [URL] = []

    public init() {}

    public func receive(_ url: URL) { links.append(url) }

    public func ready(engine: RulesEngine, store: KeyStore) async -> [KeyIntakeOutcome] {
        let taken = links
        links = []
        var out: [KeyIntakeOutcome] = []
        for url in taken { out.append(await KeyIntake.accept(url, engine: engine, store: store)) }
        return out
    }
}
