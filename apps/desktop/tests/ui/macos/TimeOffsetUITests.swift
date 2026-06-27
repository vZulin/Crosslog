import XCTest

final class TimeOffsetUITests: CrosslogUITests {
    func testTimeOffsetPopoverPublishesStateAndAppliesPaneOffset() {
        let app = launchApplication()
        openSampleLogs(in: app)

        performUiTestAction(.openActivePaneTimeOffset)
        waitForUiTestTitle("timeOffset=open", in: app)
        waitForUiTestTitle("timeOffsetPane=app-2026-06-16.log", in: app)
        waitForUiTestTitle(RedesignedShellAssertions.timeOffsetPopover, in: app)

        performUiTestAction(.setActivePaneTimeOffset)
        waitForUiTestTitle("timeOffset=closed", in: app)
        waitForUiTestTitle("activeOffset=+1m", in: app)
    }
}
