import XCTest

final class EmptyStateUITests: CrosslogUITests {
    func testEmptyStateIsAvailable() {
        let app = launchApplication()

        waitForUiTestTitle("panes=0", in: app)
        waitForUiTestTitle("files=none", in: app)
    }
}
