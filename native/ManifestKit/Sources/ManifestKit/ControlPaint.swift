import Foundation

/// The parts Orphaned and Tally both draw: the mini button, and the manila advisory line. One home, so
/// the two screens cannot drift (src/app.jsx miniBtn). manilaInk is the only ink checked against manila
/// (palette-inksoft-and-manilaink).
public enum ControlPaint {
    public enum Part: CaseIterable, Hashable, Sendable {
        case miniText, miniFill, miniBorder, advisoryText, advisoryFill
    }

    public static func token(_ part: Part) -> String? {
        switch part {
        case .miniText: return "ink"
        case .miniFill: return "card"
        case .miniBorder: return "line"
        case .advisoryText: return "manilaInk"
        case .advisoryFill: return "manila"
        }
    }
}
