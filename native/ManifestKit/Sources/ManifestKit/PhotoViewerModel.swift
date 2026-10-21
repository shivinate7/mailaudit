import Observation

public enum PhotoFocus: Equatable, Sendable { case none, viewer, thumbnail(String) }
public enum PhotoKey: Equatable, Sendable { case escape, tab, other }

/// The modal viewer's behaviour (photo-thumbnails-and-viewer). The SwiftUI view adds the isModal trait,
/// moves VoiceOver focus to `focus`, and maps Escape to handle(.escape); those are hand checks (lane N11).
@MainActor @Observable
public final class PhotoViewerModel {
    public private(set) var shown: String?
    public private(set) var focus: PhotoFocus = .none
    public var isModal: Bool { shown != nil }

    public init() {}

    /// The web opens the dialog only once the picture has loaded.
    public func open(_ id: String, hasImage: Bool) {
        guard hasImage else { return }
        shown = id
        focus = .viewer
    }

    /// A tap anywhere. Focus returns to the thumbnail that opened it.
    public func dismiss() {
        guard let id = shown else { return }
        shown = nil
        focus = .thumbnail(id)
    }

    /// The picture is the only thing to reach, so Tab and other keys change nothing.
    public func handle(_ key: PhotoKey) {
        if key == .escape { dismiss() }
    }
}
