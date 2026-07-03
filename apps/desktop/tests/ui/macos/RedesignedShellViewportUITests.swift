import XCTest

final class RedesignedShellViewportUITests: CrosslogUITests {
    func testViewportCriticalRegionsAndAccessibleStateArePublished() {
        let app = launchApplication()

        RedesignedShellAssertions.assertStatusContains("0 panes", in: app)
        waitForUiTestTitle(RedesignedShellAssertions.crosslogShell, in: app)
        waitForUiTestTitle(RedesignedShellAssertions.topbar, in: app)
        waitForUiTestTitle(RedesignedShellAssertions.commandField, in: app)
        waitForUiTestTitle(RedesignedShellAssertions.themeVariant, in: app)
        waitForUiTestTitle(RedesignedShellAssertions.platformChrome, in: app)
        waitForUiTestTitle(RedesignedShellAssertions.platformChromeTitle, in: app)
        waitForUiTestTitle(RedesignedShellAssertions.activityRail, in: app)
        waitForUiTestTitle(RedesignedShellAssertions.paneWorkspace, in: app)
        waitForUiTestTitle(RedesignedShellAssertions.statusBar, in: app)
        waitForUiTestTitle("themePreference=system", in: app)
        waitForUiTestTitle("syncVisual=active", in: app)
        waitForUiTestTitle("syncPressed=on", in: app)

        openSampleLogs(in: app)
        RedesignedShellAssertions.assertRequiredRegions(in: app)
        RedesignedShellAssertions.assertPaneCount(3, in: app)
        RedesignedShellAssertions.assertStatusContains("3 panes", in: app)
        RedesignedShellAssertions.assertStatusContains("Sync on", in: app)
        waitForUiTestTitle("active=app-2026-06-16.log", in: app)

        performUiTestAction(.openSettings)
        RedesignedShellAssertions.assertSettingsSurfaceOpen(in: app)

        performUiTestAction(.openActivePaneSearch)
        waitForUiTestTitle("search=open", in: app)
        waitForUiTestTitle(RedesignedShellAssertions.paneSearchPopover, in: app)
        RedesignedShellAssertions.assertIconCentering(in: app)

        performUiTestAction(.openActivePaneTimeOffset)
        waitForUiTestTitle("timeOffset=open", in: app)
        waitForUiTestTitle(RedesignedShellAssertions.timeOffsetPopover, in: app)
    }
}
