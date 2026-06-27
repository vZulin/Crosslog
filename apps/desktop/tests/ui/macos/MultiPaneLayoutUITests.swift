import XCTest

final class MultiPaneLayoutUITests: CrosslogUITests {
    func testMultiPaneLayoutIsAvailable() {
        let app = launchApplication()
        openSampleLogs(in: app)

        waitForUiTestTitle("files=app.log,service.log,app-2026-06-16.log", in: app)
        waitForUiTestTitle("active=app-2026-06-16.log", in: app)
    }
}
