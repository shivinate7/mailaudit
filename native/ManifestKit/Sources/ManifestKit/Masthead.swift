import Foundation
import Observation

public struct TallyCell: Equatable, Sendable {
    public let label: String
    public let figure: String
    public init(label: String, figure: String) {
        self.label = label
        self.figure = figure
    }
}

/// The first and last frame of the letterhead's compose, in the web's order
/// (motion-letterhead-composes-once). The view draws from these.
public struct LetterheadFrame: Equatable, Sendable {
    public var sealScale, sealOpacity, ruleFill, titleOpacity, talliesOpacity: Double
    public init(sealScale: Double, sealOpacity: Double, ruleFill: Double, titleOpacity: Double, talliesOpacity: Double) {
        self.sealScale = sealScale
        self.sealOpacity = sealOpacity
        self.ruleFill = ruleFill
        self.titleOpacity = titleOpacity
        self.talliesOpacity = talliesOpacity
    }
}

public enum LetterheadMotion {
    public static let final = LetterheadFrame(sealScale: 1, sealOpacity: 1, ruleFill: 1, titleOpacity: 1, talliesOpacity: 1)

    /// Reduced motion starts on the final frame, so nothing is hidden (motion-reduced-leaves-it-drawn).
    public static func start(reduceMotion: Bool) -> LetterheadFrame {
        reduceMotion ? final : LetterheadFrame(sealScale: 0.68, sealOpacity: 0, ruleFill: 0, titleOpacity: 0, talliesOpacity: 0)
    }

    /// The web sequence ends by about 1060 ms.
    public static func duration(reduceMotion: Bool) -> Double { reduceMotion ? 0 : 1.06 }
}

/// The save slot holds one of four labels (masthead-save-slot-reserved).
public enum SaveIndicator: CaseIterable, Equatable, Sendable {
    case idle, saving, saved, failed

    public var label: String {
        switch self {
        case .idle: "\u{00A0}"
        case .saving: "saving\u{2026}"
        case .saved: "saved \u{2713}"
        case .failed: "couldn\u{2019}t save"
        }
    }

    /// The longest label, `couldn’t save`. The slot reserves this many characters.
    public static let reservedCharacters = 13
}

/// The masthead's figures and save slot. Every figure comes from the rules bundle
/// (rules-run-in-javascriptcore). It holds no key (the-token-is-a-credential).
@MainActor @Observable
public final class MastheadModel {
    @ObservationIgnored private let engine: RulesEngine
    @ObservationIgnored private let store: LedgerStore
    @ObservationIgnored private let pinned: SaveIndicator?
    public private(set) var cells: [TallyCell] = []
    public private(set) var countLine = ""
    public private(set) var missingLine = ""
    private var current = SaveIndicator.idle

    /// `pinned` holds the slot on one state for a whole run (a UI test sets it).
    public init(engine: RulesEngine, store: LedgerStore, pinned: SaveIndicator? = nil) {
        self.engine = engine
        self.store = store
        self.pinned = pinned
    }

    public var indicator: SaveIndicator { pinned ?? current }

    private func json(_ value: Any) throws -> String {
        String(decoding: try JSONSerialization.data(withJSONObject: value, options: [.fragmentsAllowed]), as: UTF8.self)
    }

    private func compact(_ n: Double) async throws -> String {
        let out = try await engine.call("compact", "[\(n)]")
        guard let s = try JSONSerialization.jsonObject(with: Data(out.utf8), options: [.fragmentsAllowed]) as? String else {
            throw RulesFailure.threw("compact gave \(out)")
        }
        return s
    }

    /// Re-reads the store: totalsOf, groupPackages, packagesDone and compact.
    public func refresh() async throws {
        let got = try json(store.received())
        guard !store.items().isEmpty else { (cells, countLine, missingLine) = ([], "", ""); return }
        let items = try await LiveItems.of(store.items(), stamps: store.stamps(), engine: engine)
        let t = try JSONSerialization.jsonObject(with: Data(try await engine.call("totalsOf", "[\(items),\(got)]").utf8)) as? [String: Double] ?? [:]
        let pkgs = try await engine.call("groupPackages", "[\(items)]")
        let n = (try JSONSerialization.jsonObject(with: Data(pkgs.utf8)) as? [Any])?.count ?? 0
        let done = Int(try await engine.call("packagesDone", "[\(pkgs),\(got)]")) ?? 0
        let (total, have, val, missingVal) = (t["total"] ?? 0, t["got"] ?? 0, t["val"] ?? 0, t["missingVal"] ?? 0)
        let (inVal, allVal) = (try await compact(val - missingVal), try await compact(val))
        cells = [
            TallyCell(label: "cards", figure: "\(Int(have))/\(Int(total))"),
            TallyCell(label: "packages", figure: "\(done)/\(n)"),
            TallyCell(label: "value", figure: "$\(inVal)/$\(allVal)"),
        ]
        countLine = "\(n) packages \u{00B7} autosaves"
        let remaining = Int(total - have)
        // Exact money, with cents and thousands separators (en_US, as the card rows read).
        let money = missingVal.formatted(.currency(code: "USD").locale(Locale(identifier: "en_US")))
        missingLine = remaining == 0 ? "ALL ACCOUNTED FOR \u{2713}" : "\(remaining) still missing \u{00B7} \(money)"
    }

    public func saving() { current = .saving }

    /// After a check-in: the figures follow, and the slot reads saved or failed until the
    /// next save, as the web slot does (a clock would be one more thing that moves).
    public func finished(failed: Bool) async {
        try? await refresh()
        current = failed ? .failed : .saved
    }
}
