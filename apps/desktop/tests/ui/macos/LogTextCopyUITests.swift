import XCTest

final class LogTextCopyUITests: CrosslogUITests {
    func testCopyCommandIsAvailablePerPane() {
        let app = launchApplication()
        openSampleLogs(in: app)
        RedesignedShellAssertions.assertObsoleteControlsAbsent(in: app)

        performUiTestAction(.showFirstPaneCopyMenu)
        waitForUiTestTitle("copyAction=visible", in: app)
        waitForUiTestTitle("copyActionAnchored=on", in: app)
        waitForUiTestTitle("copyActionBounded=on", in: app)
        waitForUiTestTitle("copiedText=absent", in: app)

        performUiTestAction(.dismissCopyMenu)
        waitForUiTestTitle("copyAction=hidden", in: app)

        performUiTestAction(.copyFirstPane)
        waitForUiTestTitle("copied=app.log", in: app)
        waitForUiTestTitle("copiedText=absent", in: app)
        RedesignedShellAssertions.assertObsoleteControlsAbsent(in: app)
    }
}
