import XCTest

final class LiveFileStateUITests: CrosslogUITests {
    func testLiveDeletedAndReplacedFileStatesArePublished() {
        let app = launchApplication()
        openSampleLogs(in: app)
        RedesignedShellAssertions.assertObsoleteControlsAbsent(in: app)

        waitForUiTestTitle("lifecycle=app.log:live", in: app)

        performUiTestAction(.appendActiveFile)
        waitForUiTestTitle("lifecycle=app.log:live", in: app)
        RedesignedShellAssertions.assertObsoleteControlsAbsent(in: app)

        performUiTestAction(.deleteActiveFile)
        waitForUiTestTitle("lifecycle=app.log:deleted", in: app)
        RedesignedShellAssertions.assertObsoleteControlsAbsent(in: app)

        performUiTestAction(.replaceActiveFile)
        waitForUiTestTitle("lifecycle=app.log:replaced", in: app)
        RedesignedShellAssertions.assertObsoleteControlsAbsent(in: app)
    }
}
