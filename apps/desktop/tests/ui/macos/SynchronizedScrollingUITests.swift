import XCTest

final class SynchronizedScrollingUITests: CrosslogUITests {
    func testTopbarSynchronizationStateIsPublished() {
        let app = launchApplication()
        openSampleLogs(in: app)
        RedesignedShellAssertions.assertRequiredRegions(in: app)
        RedesignedShellAssertions.assertStatusContains("Sync on", in: app)
        waitForUiTestTitle("active=app-2026-06-16.log", in: app)

        performUiTestAction(.toggleSynchronization)
        waitForUiTestTitle("sync=off", in: app)
        RedesignedShellAssertions.assertStatusContains("Sync off", in: app)
    }
}
