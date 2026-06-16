import XCTest

final class MultiPaneLayoutUITests: CrosslogUITests {
    func testMultiPaneLayoutIsAvailable() {
        let app = launchApplication()

        app.buttons["Open logs"].click()

        XCTAssertTrue(app.staticTexts["app.log"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["service.log"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["latest.log"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.buttons["Split active pane"].waitForExistence(timeout: 5))
    }
}
