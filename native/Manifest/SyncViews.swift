import ManifestKit
import SwiftUI
import UIKit
import UIKit.UIGestureRecognizerSubclass

/// The one advisory line on the working screens (ruled-head-one-advisory-entrance). It shows the 401
/// and 413 failures. Its value is the failure's code, so a test does not depend on the wording.
struct SyncAdvisoryLine: View {
    let sync: SyncClient

    var body: some View {
        if let code = sync.advisory, let text = SyncLine.text(for: code) {
            Text(text)
                .font(.footnote)
                .padding(8)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color(uiColor: .secondarySystemBackground))
                .accessibilityElement(children: .ignore)
                .accessibilityLabel(text)
                .accessibilityValue(code)
                .accessibilityIdentifier("sync-advisory")
        }
    }
}

extension View {
    /// The advisory line above a working screen. The Ledger tab does not take it.
    func syncLine(_ sync: SyncClient?) -> some View {
        safeAreaInset(edge: .top, spacing: 0) { if let sync { SyncAdvisoryLine(sync: sync) } }
    }
}

/// Tells the press gate when a finger is down and when it is up, anywhere in the window. It watches
/// and never decides: it recognizes nothing, cancels no touch and delays none. A scroll takes the touch
/// from the views and ends the press like a lift (auto-apply-happens-now).
struct PressWatcher: UIViewRepresentable {
    let gate: PressGate?

    func makeUIView(context: Context) -> WatcherView { WatcherView() }
    func updateUIView(_ view: WatcherView, context: Context) { view.recognizer.gate = gate }

    final class WatcherView: UIView {
        let recognizer = PressRecognizer()
        override func didMoveToWindow() {
            super.didMoveToWindow()
            recognizer.view?.removeGestureRecognizer(recognizer)
            window?.addGestureRecognizer(recognizer)
        }
    }

    final class PressRecognizer: UIGestureRecognizer, UIGestureRecognizerDelegate {
        @MainActor var gate: PressGate?

        init() {
            super.init(target: nil, action: nil)
            cancelsTouchesInView = false
            delaysTouchesBegan = false
            delaysTouchesEnded = false
            delegate = self
        }

        override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent) { MainActor.assumeIsolated { gate?.down() } }
        override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent) { lifted(event) }
        override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent) { lifted(event) }

        /// The press ends when the last finger is up or cancelled.
        private func lifted(_ event: UIEvent) {
            guard event.allTouches?.allSatisfy({ $0.phase == .ended || $0.phase == .cancelled }) ?? true else { return }
            MainActor.assumeIsolated { gate?.up() }
            state = .failed
        }

        func gestureRecognizer(_ g: UIGestureRecognizer, shouldRecognizeSimultaneouslyWith other: UIGestureRecognizer) -> Bool { true }
    }
}
