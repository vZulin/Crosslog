import XCTest

final class EmptyStateUITests: CrosslogUITests {
    func testEmptyStateIsAvailable() {
        let app = launchApplication()

        waitForUiTestTitle("panes=0", in: app)
        waitForUiTestTitle("files=none", in: app)
        RedesignedShellAssertions.assertEmptyWorkspacePublished(in: app)
        RedesignedShellAssertions.assertFutureSourceControlsDisabled(in: app)
        RedesignedShellAssertions.assertSourceOpeningIdle(in: app)
        RedesignedShellAssertions.assertObsoleteControlsAbsent(in: app)
    }
}
