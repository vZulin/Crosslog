import XCTest

enum RedesignedShellAssertions {
    static let crosslogShell = "crosslog-shell"
    static let topbar = "topbar"
    static let commandField = "command-field"
    static let activityRail = "activity-rail"
    static let paneWorkspace = "pane-workspace"
    static let workspaceScrollbar = "workspace-scrollbar"
    static let logPane = "log-pane"
    static let paneHeader = "pane-header"
    static let paneSearchPopover = "pane-search-popover"
    static let timeOffsetPopover = "time-offset-popover"
    static let statusBar = "status-bar"

    static func assertRequiredRegions(
        in app: XCUIApplication,
        timeout: TimeInterval = 5,
        file: StaticString = #filePath,
        line: UInt = #line
    ) {
        [
            crosslogShell,
            topbar,
            commandField,
            activityRail,
            paneWorkspace,
            workspaceScrollbar,
            logPane,
            paneHeader,
            statusBar,
        ].forEach { identifier in
            XCTAssertTrue(
                element(matching: identifier, in: app).waitForExistence(timeout: timeout),
                "Expected redesigned shell region '\(identifier)' to exist",
                file: file,
                line: line
            )
        }
    }

    static func assertPaneCount(
        _ expectedCount: Int,
        in app: XCUIApplication,
        file: StaticString = #filePath,
        line: UInt = #line
    ) {
        XCTAssertEqual(
            app.descendants(matching: .any).matching(identifier: logPane).count,
            expectedCount,
            file: file,
            line: line
        )
    }

    static func assertStatusContains(
        _ text: String,
        in app: XCUIApplication,
        file: StaticString = #filePath,
        line: UInt = #line
    ) {
        let status = element(matching: statusBar, in: app)
        XCTAssertTrue(status.waitForExistence(timeout: 5), file: file, line: line)
        XCTAssertTrue(status.label.contains(text), file: file, line: line)
    }

    private static func element(matching identifier: String, in app: XCUIApplication) -> XCUIElement {
        app.descendants(matching: .any).matching(identifier: identifier).firstMatch
    }
}

