import XCTest

final class PaneSearchUITests: CrosslogUITests {
    func testPaneSearchPopoverStateIsPublished() {
        let app = launchApplication()
        openSampleLogs(in: app)

        performUiTestAction(.openActivePaneSearch)
        waitForUiTestTitle("search=open", in: app)
        waitForUiTestTitle("searchPane=app-2026-06-16.log", in: app)
        waitForUiTestTitle("pane-search-popover", in: app)

        performUiTestAction(.setActivePaneSearchQuery)
        waitForUiTestTitle("searchHighlights=visible", in: app)
        waitForUiTestTitle("searchHighlightCount=1", in: app)

        performUiTestAction(.closeActivePaneSearch)
        waitForUiTestTitle("search=closed", in: app)
        waitForUiTestTitle("searchHighlights=hidden", in: app)

        performUiTestAction(.openActivePaneSearch)
        waitForUiTestTitle("search=open", in: app)

        performUiTestAction(.setActivePaneInvalidSearch)
        waitForUiTestTitle("search=error", in: app)
        waitForUiTestTitle("searchPane=app-2026-06-16.log", in: app)
    }
}
