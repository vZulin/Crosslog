import XCTest

final class SynchronizedScrollingUITests: CrosslogUITests {
    func testSynchronizationToggleIsAvailable() {
        let app = launchApplication()
        openSampleLogs(in: app)

        performUiTestAction(.toggleSynchronization)
        waitForUiTestTitle("sync=off", in: app)
    }
}
