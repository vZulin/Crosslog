import XCTest

final class SynchronizedScrollingUITests: CrosslogUITests {
    func testTopbarSynchronizationStateIsPublished() {
        let app = launchApplication()
        openSampleLogs(in: app)
        RedesignedShellAssertions.assertRequiredRegions(in: app)
        RedesignedShellAssertions.assertStatusContains("Sync on", in: app)
        waitForUiTestTitle("active=app-2026-06-16.log", in: app)

        performUiTestAction(.keyboardNavigateActivePaneDown)
        waitForUiTestTitle("lastNavigation=keyboard", in: app)
        waitForUiTestTitle("selectedLine=2", in: app)

        performUiTestAction(.wheelNavigateActivePaneDown)
        waitForUiTestTitle("lastNavigation=wheel", in: app)
        waitForUiTestTitle("selectedLine=5", in: app)

        performUiTestAction(.toggleSynchronization)
        waitForUiTestTitle("sync=off", in: app)
        RedesignedShellAssertions.assertStatusContains("Sync off", in: app)
    }
}
