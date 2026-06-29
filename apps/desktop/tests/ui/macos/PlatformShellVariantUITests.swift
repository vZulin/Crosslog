import XCTest

final class PlatformShellVariantUITests: CrosslogUITests {
    func testMacosChromeAndSharedProductRegionsArePublished() {
        let app = launchApplication()

        RedesignedShellAssertions.assertThemeVariant("light", in: app)
        RedesignedShellAssertions.assertPlatformVariant("macos", in: app)
        waitForUiTestTitle(RedesignedShellAssertions.platformChrome, in: app)
        waitForUiTestTitle(RedesignedShellAssertions.platformChromeTitle, in: app)
        RedesignedShellAssertions.assertEmptyWorkspacePublished(in: app)

        openSampleLogs(in: app)
        RedesignedShellAssertions.assertRequiredRegions(in: app)
        RedesignedShellAssertions.assertPaneCount(3, in: app)
        RedesignedShellAssertions.assertObsoleteControlsAbsent(in: app)
        waitForUiTestTitle(RedesignedShellAssertions.platformChrome, in: app)
    }
}
