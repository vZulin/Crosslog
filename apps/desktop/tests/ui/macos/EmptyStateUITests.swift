import XCTest

final class EmptyStateUITests: CrosslogUITests {
    func testEmptyStateIsAvailable() {
        let app = launchApplication()
        XCTAssertTrue(app.buttons["Open logs"].waitForExistence(timeout: 5))
    }
}

