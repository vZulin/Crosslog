import XCTest

final class SynchronizedScrollingUITests: CrosslogUITests {
    func testSynchronizationToggleIsAvailable() {
        let app = launchApplication()

        app.buttons["Open logs"].click()

        XCTAssertTrue(app.checkBoxes["Synchronize by time"].waitForExistence(timeout: 5))
        app.checkBoxes["Synchronize by time"].click()
    }
}
