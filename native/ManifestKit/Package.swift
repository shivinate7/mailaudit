// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "ManifestKit",
    platforms: [.macOS(.v14), .iOS(.v17)],
    products: [.library(name: "ManifestKit", targets: ["ManifestKit"])],
    targets: [
        .target(name: "ManifestKit"),
        .testTarget(
            name: "ManifestKitTests", dependencies: ["ManifestKit"],
            // KeychainFakes.swift names KeychainBackend with no import line.
            swiftSettings: [.unsafeFlags(["-Xfrontend", "-import-module", "-Xfrontend", "ManifestKit"])]
        ),
    ]
)
