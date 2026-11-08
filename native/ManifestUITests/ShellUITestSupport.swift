// Launch and frame helpers shared by the shell cases (one home: building-one-home-per-capability).
// PackagesShellUITests and the step 8 cases (FindPillUITests, LedgerViewUITests) call these. Every key
// is fake: the launch reads the bundled seed and no Keychain item.
import XCTest

enum ShellUITest {
    /// Launches on the bundled fake seed. `width` frames the root content (-ManifestUITestWidth).
    static func launch(width: Int? = nil) -> XCUIApplication {
        let app = XCUIApplication()
        var args = ["-ManifestUITestSeed"]
        if let width { args += ["-ManifestUITestWidth", String(width)] }
        app.launchArguments = args
        app.launch()
        return app
    }

    static func elements(_ app: XCUIApplication, prefix: String) -> [XCUIElement] {
        app.descendants(matching: .any)
            .matching(NSPredicate(format: "identifier BEGINSWITH %@", prefix))
            .allElementsBoundByIndex
    }

    /// Frame of every package row and every check-in control, by identifier.
    static func layoutFrames(_ app: XCUIApplication) -> [String: CGRect] {
        var out: [String: CGRect] = [:]
        for el in elements(app, prefix: "package-row:") + elements(app, prefix: "checkin:") {
            out[el.identifier] = el.frame
        }
        return out
    }

    /// The element with this identifier, or one that does not exist yet (a missing control fails its own wait).
    static func element(_ app: XCUIApplication, _ id: String) -> XCUIElement {
        app.descendants(matching: .any).matching(identifier: id).firstMatch
    }

    /// The identifier of the package row drawn highest on screen, or nil when none is drawn.
    static func topPackageRow(_ app: XCUIApplication) -> String? {
        elements(app, prefix: "package-row:").sorted { $0.frame.minY < $1.frame.minY }.first?.identifier
    }
}
