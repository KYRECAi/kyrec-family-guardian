// swift-tools-version: 5.9
import PackageDescription
let package = Package(
    name: "KyrecGuardianSession",
    platforms: [.iOS(.v15)],
    products: [.library(name: "KyrecGuardianSession", targets: ["GuardianSessionPlugin"])],
    dependencies: [.package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", exact: "8.4.3")],
    targets: [.target(name: "GuardianSessionPlugin", dependencies: [
        .product(name: "Capacitor", package: "capacitor-swift-pm"),
        .product(name: "Cordova", package: "capacitor-swift-pm")
    ], path: "ios/Sources/GuardianSessionPlugin")]
)
