import Foundation

/// One card line of an envelope: a name and a count.
public struct EnvelopeEntry: Equatable, Sendable {
    public var name: String
    public var qty: Int
    public init(name: String, qty: Int) { self.name = name; self.qty = qty }
}

/// A live envelope. The model keeps the raw record; this is what the screen reads.
public struct Envelope: Equatable, Sendable {
    public let id: String
    public let createdAt, updatedAt: Double
    public let note: String
    public let entries: [EnvelopeEntry]
}

/// One check-in a candidate would apply: `take` copies on the line `itemKey`.
public struct PlanStep: Equatable, Sendable, Decodable {
    public let itemKey: String
    public let take: Int
}

/// One row of the bundle's rankCandidates. The numbers are the bundle's; Swift adds no matching.
public struct Candidate: Equatable, Sendable, Decodable {
    public let pkg: Package
    public let matchedQty, entriesTotal, poolTotal, pkgLeft, envLeft: Int
    public let plan: [PlanStep]
    public let exact: Bool
    /// Copies each entry gets, by normName. The assign uses it to shrink the envelope.
    let perEntry: [String: Int]
}

public struct Ranked: Equatable, Sendable {
    public let list: [Candidate]
    public let tied: Int
    /// normName of each entry some candidate explains.
    public let explainable: Set<String>

    /// Only a lone perfect fit stands out. A tie never does (orphaned-mail-never-decides).
    public func emphasized(_ c: Candidate) -> Bool { c.exact && tied < 2 }

    static let none = Ranked(list: [], tied: 0, explainable: [])
}

public struct Suggestion: Equatable, Sendable {
    public let name: String
    public let qty, sellerCount: Int
}

public enum ComposerTarget: Hashable, Sendable { case new; case edit(String) }

public struct EnvelopeDraft: Equatable, Sendable {
    public var input: String
    public var entries: [EnvelopeEntry]
    public var note: String
    public init(input: String, entries: [EnvelopeEntry], note: String) {
        self.input = input; self.entries = entries; self.note = note
    }
}

/// What the Undo notice says. `index` is the pile slot the envelope left.
public struct UndoNotice: Equatable, Sendable {
    public let matchedQty, leftoverQty, index: Int
    public let pkgLabel: String
}

/// The words on the Orphaned screen, as on the web (src/app.jsx).
public enum OrphanedNotice {
    public static let emptyLine = "Nothing waiting: record a package here when you can\u{2019}t tell who sent it."

    public static func tieLine(tied: Int) -> String? {
        tied > 1 ? "\(tied) packages fit these cards equally well \u{2014} pick the right one yourself." : nil
    }

    public static func undoLine(matchedQty: Int, pkgLabel: String, leftoverQty: Int) -> String {
        func cards(_ n: Int) -> String { "\(n) card\(n == 1 ? "" : "s")" }
        return "Checked in \(cards(matchedQty)) against \(pkgLabel)."
            + (leftoverQty > 0 ? " \(cards(leftoverQty)) still in the envelope." : "")
    }
}
