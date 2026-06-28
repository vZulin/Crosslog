import XCTest

final class LogTextCopyUITests: CrosslogUITests {
    func testCopyCommandIsAvailablePerPane() {
        let app = launchApplication()
        openSampleLogs(in: app)
        RedesignedShellAssertions.assertObsoleteControlsAbsent(in: app)

        performUiTestAction(.copyFirstPane)
        waitForUiTestTitle("copied=app.log", in: app)
        RedesignedShellAssertions.assertObsoleteControlsAbsent(in: app)
    }
}
