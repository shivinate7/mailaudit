import CoreGraphics

/// The hinge of a book foldable. `.none` is a device without one.
public enum DuoHinge: Equatable, Sendable { case none, closed, halfOpen, flat }

extension DuoHinge {
    /// Maps an SDK hinge status, given with its three known values. nil, or a status a later SDK adds, is `.none`,
    /// so an unknown state never splits the screen.
    public init<Status: Equatable>(status: Status?, closed: Status, partiallyOpen: Status, fullyOpen: Status) {
        switch status {
        case closed?: self = .closed
        case partiallyOpen?: self = .halfOpen
        case fullyOpen?: self = .flat
        default: self = .none
        }
    }
}

/// The tabs that can show on an open Duo. `.packages` is the Packages tab as it is, the web's one-page layout, and is not `.cardInHand`.
public enum DuoTab: Equatable, Sendable { case ledger, tally, orphaned, cardInHand, packages }

/// How the inner screen splits at the fold. Rects are in window points, origin top-left, and never cover the fold.
public enum DuoSpread: Equatable, Sendable {
    case single
    case sideBySide(left: CGRect, right: CGRect)
    case stacked(top: CGRect, bottom: CGRect)

    /// Two pages only when an open hinge has a fold inside the window. The window's width alone never splits it,
    /// so a wide iPad, or a Split View half the fold sits outside of, stays one page.
    public static func layout(window: CGSize, folds: [CGRect], hinge: DuoHinge) -> DuoSpread {
        guard hinge == .halfOpen || hinge == .flat else { return .single }
        let bounds = CGRect(origin: .zero, size: window)
        // A fold only partly inside is clipped to the window. One that reaches an edge leaves a page empty, so it is no split.
        for fold in folds.map({ $0.intersection(bounds) }) where !fold.isEmpty {
            // A fold taller than wide is a vertical spine: pages left and right. Held tall, it is wider: pages stack.
            if fold.height > fold.width {
                guard fold.minX > 0, fold.maxX < window.width else { continue }
                return .sideBySide(left: CGRect(x: 0, y: 0, width: fold.minX, height: window.height),
                                   right: CGRect(x: fold.maxX, y: 0, width: window.width - fold.maxX, height: window.height))
            }
            guard fold.minY > 0, fold.maxY < window.height else { continue }
            return .stacked(top: CGRect(x: 0, y: 0, width: window.width, height: fold.minY),
                            bottom: CGRect(x: 0, y: fold.maxY, width: window.width, height: window.height - fold.maxY))
        }
        return .single
    }

    /// `right` is always the answer page, so callers place by name and never by layout. Side by side it is the right
    /// page. Stacked it is the top page, and `left` is the bottom one. nil on one page.
    public var pageRects: (left: CGRect, right: CGRect)? {
        switch self {
        case .single: nil
        case let .sideBySide(l, r): (l, r)
        case let .stacked(t, b): (b, t)
        }
    }

    /// The Ledger tab holds options and stays full width. Packages keeps the web's one page until Card in Hand is built
    /// (decision duo-card-in-hand, Defaults). The other tabs spread over both pages.
    public static func spreads(tab: DuoTab) -> Bool {
        switch tab {
        case .ledger, .packages: false
        case .tally, .orphaned, .cardInHand: true
        }
    }
}

/// Where the custom tab bar goes on an open Duo. The system bar spans the middle of the inner screen, across the fold,
/// so two pages side by side get a bar under the right page. One page, or pages stacked across the fold, keep the system bar.
public enum DuoTabBar {
    /// The bar's rect in the spread's space: the right page's width, at its bottom. nil means the system bar shows.
    public static func frame(in spread: DuoSpread, height: CGFloat) -> CGRect? {
        guard case let .sideBySide(_, right) = spread else { return nil }
        return CGRect(x: right.minX, y: right.maxY - height, width: right.width, height: height)
    }
}

/// The item the open Duo's right page shows: the picked one, else the first. A pick that is gone, as after a discard, falls to the first.
public func pickedOrFirst<Item, ID: Equatable>(_ items: [Item], picked: ID?, id: (Item) -> ID) -> Item? {
    items.first { id($0) == picked } ?? items.first
}
