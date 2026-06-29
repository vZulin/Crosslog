import XCTest

final class PaneSearchUITests: CrosslogUITests {
    func testPaneSearchPopoverStateIsPublished() {
        let app = launchApplication()
        openSampleLogs(in: app)

        performUiTestAction(.openActivePaneSearch)
        waitForUiTestTitle("search=open", in: app)
        waitForUiTestTitle("searchPane=app-2026-06-16.log", in: app)
        waitForUiTestTitle("pane-search-popover", in: app)

        performUiTestAction(.setActivePaneInvalidSearch)
        waitForUiTestTitle("search=error", in: app)
        waitForUiTestTitle("searchPane=app-2026-06-16.log", in: app)
    }
}
