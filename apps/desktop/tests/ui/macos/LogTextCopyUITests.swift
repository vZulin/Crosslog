import XCTest

final class LogTextCopyUITests: CrosslogUITests {
    func testCopyCommandIsAvailablePerPane() {
        let app = launchApplication()

        app.buttons["Open logs"].click()
        app.buttons["Copy selected text from app.log"].click()

        XCTAssertTrue(app.staticTexts["Copied"].waitForExistence(timeout: 5))
    }
}
