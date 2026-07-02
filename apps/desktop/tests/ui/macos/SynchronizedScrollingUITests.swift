import XCTest

final class SynchronizedScrollingUITests: CrosslogUITests {
    func testTopbarSynchronizationStateIsPublished() {
        let app = launchApplication()
        openSampleLogs(in: app)
        RedesignedShellAssertions.assertRequiredRegions(in: app)
        RedesignedShellAssertions.assertStatusContains("Sync on", in: app)
        waitForUiTestTitle("active=app-2026-06-16.log", in: app)

        performUiTestAction(.keyboardNavigateActivePaneDown)
        waitForUiTestTitle("lastNavigation=keyboard", in: app)
        waitForUiTestTitle("selectedLine=2", in: app)

        performUiTestAction(.wheelNavigateActivePaneDown)
        waitForUiTestTitle("lastNavigation=wheel", in: app)
        let firstWheelLine = waitForSelectedLine(atLeast: 3, in: app)

        // Bug 5: each vertical scroll must advance the rendered text, not only the
        // selection indicator. A second wheel keeps moving the anchor line forward.
        performUiTestAction(.wheelNavigateActivePaneDown)
        waitForUiTestTitle("lastNavigation=wheel", in: app)
        _ = waitForSelectedLine(greaterThan: firstWheelLine, in: app)

        performUiTestAction(.toggleSynchronization)
        waitForUiTestTitle("sync=off", in: app)
        RedesignedShellAssertions.assertStatusContains("Sync off", in: app)
    }

    private func waitForSelectedLine(
        atLeast minimumLine: Int,
        in app: XCUIApplication,
        timeout: TimeInterval = 10,
        file: StaticString = #filePath,
        line: UInt = #line
    ) -> Int {
        waitForSelectedLine(in: app, timeout: timeout, file: file, line: line) { selectedLine in
            selectedLine >= minimumLine
        } failureMessage: { title in
            "Expected selectedLine to be at least \(minimumLine), actual title: '\(title)'"
        }
    }

    private func waitForSelectedLine(
        greaterThan previousLine: Int,
        in app: XCUIApplication,
        timeout: TimeInterval = 10,
        file: StaticString = #filePath,
        line: UInt = #line
    ) -> Int {
        waitForSelectedLine(in: app, timeout: timeout, file: file, line: line) { selectedLine in
            selectedLine > previousLine
        } failureMessage: { title in
            "Expected selectedLine to advance beyond \(previousLine), actual title: '\(title)'"
        }
    }

    private func waitForSelectedLine(
        in app: XCUIApplication,
        timeout: TimeInterval,
        file: StaticString,
        line: UInt,
        predicate: (Int) -> Bool,
        failureMessage: (String) -> String
    ) -> Int {
        let deadline = Date().addingTimeInterval(timeout)
        let window = app.windows.firstMatch

        while Date() < deadline {
            let title = window.title

            if let selectedLine = selectedLineNumber(from: title), predicate(selectedLine) {
                return selectedLine
            }

            RunLoop.current.run(until: Date().addingTimeInterval(0.1))
        }

        XCTFail(failureMessage(window.title), file: file, line: line)
        return -1
    }

    private func selectedLineNumber(from title: String) -> Int? {
        title
            .components(separatedBy: ";")
            .first { $0.hasPrefix("selectedLine=") }
            .flatMap { Int($0.replacingOccurrences(of: "selectedLine=", with: "")) }
    }
}
