import ImageIO
import ManifestKit
import SwiftUI

/// Decodes a stored blob to a picture no larger than `maxPixel` on its long edge. Nil when it does not decode.
private func decodePhoto(_ store: PhotoStore, _ id: String, maxPixel: Int) async -> CGImage? {
    guard let blob = try? await store.get(id: id),
          let src = CGImageSourceCreateWithData(blob.data as CFData, nil) else { return nil }
    let opts: [CFString: Any] = [
        kCGImageSourceCreateThumbnailFromImageAlways: true,
        kCGImageSourceCreateThumbnailWithTransform: true,
        kCGImageSourceThumbnailMaxPixelSize: maxPixel,
    ]
    return CGImageSourceCreateThumbnailAtIndex(src, 0, opts as CFDictionary)
}

/// The envelope's photo tiles: 56pt squares (photo-thumbnails-and-viewer). A tap opens the viewer, and
/// focus comes back to the tile that opened it. Not wired to a screen yet (debt `native-photo-screens-unwired`).
struct PhotoStrip: View {
    let ids: [String]
    let store: PhotoStore
    let viewer: PhotoViewerModel
    @AccessibilityFocusState private var focusedTile: String?

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(ids, id: \.self) { id in
                    PhotoTile(id: id, store: store, viewer: viewer)
                        .accessibilityFocused($focusedTile, equals: id)
                }
            }
        }
        .frame(height: 56)
        .onChange(of: viewer.focus) { _, focus in
            if case .thumbnail(let id) = focus { focusedTile = id }
        }
    }
}

private struct PhotoTile: View {
    let id: String
    let store: PhotoStore
    let viewer: PhotoViewerModel
    @State private var image: CGImage?

    var body: some View {
        Button {
            viewer.open(id, hasImage: image != nil)
        } label: {
            Group {
                if let image { Image(decorative: image, scale: 1).resizable().scaledToFill() } else { Color.secondary.opacity(0.2) }
            }
            .frame(width: 56, height: 56).clipped()
        }
        .buttonStyle(.plain)
        .accessibilityLabel("Open label photo")
        .task(id: id) { image = await decodePhoto(store, id, maxPixel: 112) }
    }
}

/// The full-screen modal viewer. A tap or Escape closes it. The picture is the only thing to reach.
struct PhotoViewer: View {
    let viewer: PhotoViewerModel
    let store: PhotoStore
    @State private var image: CGImage?
    @AccessibilityFocusState private var onViewer: Bool

    var body: some View {
        if let id = viewer.shown {
            ZStack {
                Parchment.scrim.ignoresSafeArea()
                if let image { Image(decorative: image, scale: 1).resizable().scaledToFit() }
            }
            .contentShape(Rectangle())
            .onTapGesture { viewer.dismiss() }
            .onKeyPress(.escape) { viewer.handle(.escape); return .handled }
            .onKeyPress(.tab) { viewer.handle(.tab); return .handled }
            .accessibilityElement(children: .ignore)
            .accessibilityLabel("Label photo")
            .accessibilityAddTraits([.isModal, .isImage, .isButton])
            .accessibilityHint("Closes the photo")
            .accessibilityAction(.escape) { viewer.handle(.escape) }
            .accessibilityFocused($onViewer)
            .focusable()
            .task(id: id) { image = await decodePhoto(store, id, maxPixel: PhotoDownscale.maxEdge) }
            .onAppear { onViewer = true }
            .accessibilityIdentifier("photo-viewer")
        }
    }
}

/// The photo upload line and its Stop control (native-build-lanes, N10). The row keeps its height, so
/// starting a run moves nothing (no-layout-shift-under-pointer).
struct PhotoSyncBar: View {
    let sync: PhotoSync

    var body: some View {
        HStack {
            if sync.running, let p = sync.progress {
                Text("Sending photos \(p.done) of \(p.total)").font(.footnote).monospacedDigit()
                Spacer()
                Button("Stop") { sync.stop() }
                    .frame(minWidth: 44, minHeight: 44)
                    .accessibilityIdentifier("photo-stop")
            }
        }
        .frame(minHeight: 44)
    }
}
