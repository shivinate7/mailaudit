// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "ManifestKit",
    platforms: [.macOS("26.0"), .iOS("26.0")],
    products: [.library(name: "ManifestKit", targets: ["ManifestKit"])],
    targets: [
        .target(name: "ManifestKit"),
        .testTarget(
            name: "ManifestKitTests", dependencies: ["ManifestKit"]
        ),
    ]
)
