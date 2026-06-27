import XCTest

final class DirectoryNavigationUITests: CrosslogUITests {
    func testDirectoryNavigationStateIsPublished() {
        let app = launchApplication()
        openSampleLogs(in: app)

        waitForUiTestTitle("directory=logs/2026", in: app)
        waitForUiTestTitle("directoryFile=app-2026-06-16.log", in: app)
        waitForUiTestTitle("directoryPrevious=off", in: app)
        waitForUiTestTitle("directoryNext=on", in: app)

        performUiTestAction(.navigateNextDirectoryFile)
        waitForUiTestTitle("directoryFile=app-2026-06-15.log", in: app)
        waitForUiTestTitle("directoryPrevious=on", in: app)
        waitForUiTestTitle("directoryNext=on", in: app)

        performUiTestAction(.navigatePreviousDirectoryFile)
        performUiTestAction(.discoverNewerDirectoryFile)
        waitForUiTestTitle("directoryFile=app-2026-06-16.log", in: app)
        waitForUiTestTitle("directoryPrevious=on", in: app)

        performUiTestAction(.navigatePreviousDirectoryFile)
        waitForUiTestTitle("directoryFile=app-2026-06-17.log", in: app)
    }
}
