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
        waitForUiTestTitle("selectedLine=2", in: app)

        // Bug 5: after an explicit selection, vertical scroll moves the rendered
        // text while preserving the selected anchor line.
        performUiTestAction(.wheelNavigateActivePaneDown)
        waitForUiTestTitle("lastNavigation=wheel", in: app)
        waitForUiTestTitle("selectedLine=2", in: app)

        performUiTestAction(.toggleSynchronization)
        waitForUiTestTitle("sync=off", in: app)
        RedesignedShellAssertions.assertStatusContains("Sync off", in: app)
    }

    func testLargeLogFastScrollKeepsViewportRowsVisible() {
        let app = launchApplication()

        performUiTestAction(.openLargeLog)
        waitForUiTestTitle("files=idea.3.log", in: app, timeout: 20)
        waitForUiTestTitle("renderedRows=400", in: app)
        _ = waitForTitleInteger("visibleRows", atLeast: 1, in: app)

        enqueueUiTestActions(Array(repeating: .wheelNavigateActivePaneDown, count: 110))

        let deadline = Date().addingTimeInterval(20)
        let window = app.windows.firstMatch

        while Date() < deadline {
            let title = window.title

            if titleInteger("visibleRows", from: title) == 0 {
                XCTFail("Large log viewport went blank during fast scroll. Title: '\(title)'")
                return
            }

            if let selectedLine = selectedLineNumber(from: title), selectedLine >= 250 {
                XCTAssertGreaterThan(titleInteger("visibleRows", from: title) ?? 0, 0)
                XCTAssertEqual(titleInteger("renderedRows", from: title), 400)
                return
            }

            RunLoop.current.run(until: Date().addingTimeInterval(0.05))
        }

        XCTFail("Expected large log fast scroll to reach line 250, actual title: '\(window.title)'")
    }

    func testLargeLogNativeFastWheelKeepsViewportRowsVisible() {
        let app = launchApplication()

        performUiTestAction(.openLargeLog)
        waitForLargeLogViewport(in: app)

        let window = app.windows.firstMatch
        let scrollPoint = window.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.55))
        let deltaY = nativeScrollDownDeltaY(using: scrollPoint, in: app)

        let deadline = Date().addingTimeInterval(20)

        while Date() < deadline {
            scrollPoint.scroll(byDeltaX: 0, deltaY: deltaY)
            assertLargeLogViewportHasVisibleRows(in: app)

            if let selectedLine = selectedLineNumber(from: window.title), selectedLine >= 650 {
                XCTAssertEqual(titleInteger("renderedRows", from: window.title), 400)
                return
            }

            RunLoop.current.run(until: Date().addingTimeInterval(0.01))
        }

        XCTFail("Expected native fast wheel scrolling to reach line 650, actual title: '\(window.title)'")
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

    private func waitForLargeLogViewport(
        in app: XCUIApplication,
        file: StaticString = #filePath,
        line: UInt = #line
    ) {
        waitForUiTestTitle("files=idea.3.log", in: app, timeout: 20, file: file, line: line)
        waitForUiTestTitle("renderedRows=400", in: app, file: file, line: line)
        _ = waitForTitleInteger("visibleRows", atLeast: 1, in: app, file: file, line: line)
    }

    private func nativeScrollDownDeltaY(
        using coordinate: XCUICoordinate,
        in app: XCUIApplication,
        file: StaticString = #filePath,
        line: UInt = #line
    ) -> CGFloat {
        let initialLine = selectedLineNumber(from: app.windows.firstMatch.title) ?? 1

        for deltaY in [-600.0, 600.0] {
            coordinate.scroll(byDeltaX: 0, deltaY: deltaY)

            if waitForSelectedLineNumber(greaterThan: initialLine, in: app, timeout: 2) != nil {
                return CGFloat(deltaY)
            }
        }

        XCTFail("Native scroll input did not move the large log viewport down", file: file, line: line)
        return 600
    }

    private func waitForSelectedLineNumber(
        greaterThan previousLine: Int,
        in app: XCUIApplication,
        timeout: TimeInterval
    ) -> Int? {
        let deadline = Date().addingTimeInterval(timeout)
        let window = app.windows.firstMatch

        while Date() < deadline {
            if let selectedLine = selectedLineNumber(from: window.title), selectedLine > previousLine {
                return selectedLine
            }

            RunLoop.current.run(until: Date().addingTimeInterval(0.05))
        }

        return nil
    }

    private func assertLargeLogViewportHasVisibleRows(
        in app: XCUIApplication,
        file: StaticString = #filePath,
        line: UInt = #line
    ) {
        let title = app.windows.firstMatch.title

        XCTAssertGreaterThan(
            titleInteger("visibleRows", from: title) ?? 0,
            0,
            "Large log viewport went blank during native fast scroll. Title: '\(title)'",
            file: file,
            line: line
        )
    }

    private func waitForTitleInteger(
        _ key: String,
        atLeast minimumValue: Int,
        in app: XCUIApplication,
        timeout: TimeInterval = 10,
        file: StaticString = #filePath,
        line: UInt = #line
    ) -> Int {
        let deadline = Date().addingTimeInterval(timeout)
        let window = app.windows.firstMatch

        while Date() < deadline {
            let title = window.title

            if let value = titleInteger(key, from: title), value >= minimumValue {
                return value
            }

            RunLoop.current.run(until: Date().addingTimeInterval(0.1))
        }

        XCTFail("Expected \(key) to be at least \(minimumValue), actual title: '\(window.title)'", file: file, line: line)
        return -1
    }

    private func selectedLineNumber(from title: String) -> Int? {
        titleInteger("selectedLine", from: title)
    }

    private func titleInteger(_ key: String, from title: String) -> Int? {
        title
            .components(separatedBy: ";")
            .first { $0.hasPrefix("\(key)=") }
            .flatMap { Int($0.replacingOccurrences(of: "\(key)=", with: "")) }
    }
}
