import XCTest

final class MultiPaneLayoutUITests: CrosslogUITests {
    func testMultiPaneLayoutIsAvailable() {
        let app = launchApplication()

        RedesignedShellAssertions.assertStatusContains("0 panes", in: app)
        openSampleLogs(in: app)

        RedesignedShellAssertions.assertRequiredRegions(in: app)
        RedesignedShellAssertions.assertPaneCount(3, in: app)
        RedesignedShellAssertions.assertStatusContains("3 panes", in: app)
        RedesignedShellAssertions.assertStatusContains("Sync on", in: app)
        waitForUiTestTitle("files=app.log,service.log,app-2026-06-16.log", in: app)
        waitForUiTestTitle("active=app-2026-06-16.log", in: app)
    }
}
