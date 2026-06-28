import XCTest

enum RedesignedShellAssertions {
    static let crosslogShell = "crosslog-shell"
    static let topbar = "topbar"
    static let commandField = "command-field"
    static let topbarSync = "topbar-sync"
    static let topbarAddPane = "topbar-add-pane"
    static let themeVariant = "theme-variant"
    static let platformChrome = "platform-chrome"
    static let platformChromeTitle = "platform-chrome-title"
    static let platformChromeMacosTrafficLights = "platform-chrome-macos-traffic-lights"
    static let platformChromeWindowsCaptionControls = "platform-chrome-windows-caption-controls"
    static let platformChromeLinuxCaptionControls = "platform-chrome-linux-caption-controls"
    static let platformChromeWebTitle = "platform-chrome-web-title"
    static let activityRail = "activity-rail"
    static let emptyWorkspace = "empty-workspace"
    static let emptyDropZone = "empty-drop-zone"
    static let emptyOpenSource = "empty-open-source"
    static let paneWorkspace = "pane-workspace"
    static let paneResizeBoundary = "pane-resize-boundary"
    static let workspaceScrollbar = "workspace-scrollbar"
    static let logPane = "log-pane"
    static let paneHeader = "pane-header"
    static let paneSearchPopover = "pane-search-popover"
    static let timeOffsetPopover = "time-offset-popover"
    static let statusBar = "status-bar"
    static let obsoleteWorkspaceToolbar = "obsolete-workspace-toolbar"
    static let obsoletePaneCopyToolbar = "obsolete-pane-copy-toolbar"
    static let obsoleteSplitButton = "obsolete-split-button"
    static let obsoleteResizeDecrease = "obsolete-resize-decrease"
    static let obsoleteResizeIncrease = "obsolete-resize-increase"
    static let obsoletePaneReadyFooter = "obsolete-pane-ready-footer"

    static func assertRequiredRegions(
        in app: XCUIApplication,
        timeout: TimeInterval = 5,
        file: StaticString = #filePath,
        line: UInt = #line
    ) {
        let expectedRegions = [
            crosslogShell,
            topbar,
            commandField,
            activityRail,
            paneWorkspace,
            workspaceScrollbar,
            logPane,
            paneHeader,
            statusBar,
        ]

        expectedRegions.forEach { identifier in
            XCTAssertTrue(
                waitForUiTestTitleFragment("regions=", containing: identifier, in: app, timeout: timeout),
                "Expected redesigned shell region '\(identifier)' to be published",
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
        XCTAssertTrue(
            waitForUiTestTitleFragment("panes=\(expectedCount)", in: app, timeout: 5),
            "Expected redesigned shell pane count \(expectedCount)",
            file: file,
            line: line
        )
    }

    static func assertEmptyWorkspacePublished(
        in app: XCUIApplication,
        file: StaticString = #filePath,
        line: UInt = #line
    ) {
        [emptyWorkspace, emptyDropZone, emptyOpenSource].forEach { identifier in
            XCTAssertTrue(
                waitForUiTestTitleFragment("regions=", containing: identifier, in: app, timeout: 5),
                "Expected empty workspace region '\(identifier)' to be published",
                file: file,
                line: line
            )
        }
    }

    static func assertThemeVariant(
        _ expectedVariant: String,
        in app: XCUIApplication,
        file: StaticString = #filePath,
        line: UInt = #line
    ) {
        XCTAssertTrue(
            waitForUiTestTitleFragment("theme=\(expectedVariant)", in: app, timeout: 5),
            "Expected shell theme variant '\(expectedVariant)'",
            file: file,
            line: line
        )
    }

    static func assertPlatformVariant(
        _ expectedVariant: String,
        in app: XCUIApplication,
        file: StaticString = #filePath,
        line: UInt = #line
    ) {
        XCTAssertTrue(
            waitForUiTestTitleFragment("platform=\(expectedVariant)", in: app, timeout: 5),
            "Expected shell platform variant '\(expectedVariant)'",
            file: file,
            line: line
        )
    }

    static func assertResizeBoundaryPublished(
        in app: XCUIApplication,
        file: StaticString = #filePath,
        line: UInt = #line
    ) {
        XCTAssertTrue(
            waitForUiTestTitleFragment("regions=", containing: paneResizeBoundary, in: app, timeout: 5),
            "Expected pane resize boundary region to be published",
            file: file,
            line: line
        )
    }

    static func assertObsoleteControlsAbsent(
        in app: XCUIApplication,
        file: StaticString = #filePath,
        line: UInt = #line
    ) {
        XCTAssertTrue(
            waitForUiTestTitleFragment("obsolete=absent", in: app, timeout: 5),
            "Expected obsolete product controls to be absent",
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
        XCTAssertTrue(
            waitForUiTestTitleStatus(text, in: app),
            "Expected redesigned status to contain '\(text)'",
            file: file,
            line: line
        )
    }

    private static func waitForUiTestTitleStatus(
        _ statusText: String,
        in app: XCUIApplication,
        timeout: TimeInterval = 5
    ) -> Bool {
        let mappedFragment: String

        switch statusText {
        case "0 panes":
            mappedFragment = "panes=0"
        case "1 pane":
            mappedFragment = "panes=1"
        case "Sync on":
            mappedFragment = "sync=on"
        case "Sync off":
            mappedFragment = "sync=off"
        default:
            if statusText.hasSuffix(" panes") {
                mappedFragment = "panes=\(statusText.replacingOccurrences(of: " panes", with: ""))"
            } else {
                mappedFragment = statusText
            }
        }

        return waitForUiTestTitleFragment(mappedFragment, in: app, timeout: timeout)
    }

    private static func waitForUiTestTitleFragment(
        _ fragment: String,
        containing containedFragment: String? = nil,
        in app: XCUIApplication,
        timeout: TimeInterval
    ) -> Bool {
        let deadline = Date().addingTimeInterval(timeout)
        let window = app.windows.firstMatch

        while Date() < deadline {
            let title = window.title
            let containsFragment = title.contains(fragment)
            let containsNestedFragment = containedFragment.map { title.contains($0) } ?? true

            if window.exists, containsFragment, containsNestedFragment {
                return true
            }

            RunLoop.current.run(until: Date().addingTimeInterval(0.1))
        }

        return false
    }
}
