import XCTest

final class RedesignedShellViewportUITests: CrosslogUITests {
    func testViewportCriticalRegionsAndAccessibleStateArePublished() {
        let app = launchApplication()

        RedesignedShellAssertions.assertStatusContains("0 panes", in: app)
        waitForUiTestTitle("regions=crosslog-shell,topbar,command-field,activity-rail,pane-workspace,status-bar", in: app)

        openSampleLogs(in: app)
        RedesignedShellAssertions.assertRequiredRegions(in: app)
        RedesignedShellAssertions.assertPaneCount(3, in: app)
        RedesignedShellAssertions.assertStatusContains("3 panes", in: app)
        RedesignedShellAssertions.assertStatusContains("Sync on", in: app)
        waitForUiTestTitle("active=app-2026-06-16.log", in: app)

        performUiTestAction(.openActivePaneSearch)
        waitForUiTestTitle("search=open", in: app)
        waitForUiTestTitle(RedesignedShellAssertions.paneSearchPopover, in: app)

        performUiTestAction(.openActivePaneTimeOffset)
        waitForUiTestTitle("timeOffset=open", in: app)
        waitForUiTestTitle(RedesignedShellAssertions.timeOffsetPopover, in: app)
    }
}
