import Foundation
import XCTest

enum CrosslogUITestAction: String {
    case openSampleLogs
    case openLargeLog
    case copyFirstPane
    case toggleSynchronization
    case openSettings
    case closeSettings
    case setThemeSystem
    case setThemeLight
    case setThemeDark
    case reorderFirstPaneAfterSecond
    case keyboardNavigateActivePaneDown
    case wheelNavigateActivePaneDown
    case openActivePaneSearch
    case setActivePaneSearchQuery
    case setActivePaneInvalidSearch
    case closeActivePaneSearch
    case showFirstPaneCopyMenu
    case dismissCopyMenu
    case navigatePreviousDirectoryFile
    case navigateNextDirectoryFile
    case discoverNewerDirectoryFile
    case openActivePaneTimeOffset
    case setActivePaneTimeOffset
    case appendActiveFile
    case deleteActiveFile
    case replaceActiveFile
}

class CrosslogUITests: XCTestCase {
    private var actionsURL: URL?

    override func setUp() {
        super.setUp()
        continueAfterFailure = false
    }

    override func tearDown() {
        application().terminate()
        removeActionsFile()
        super.tearDown()
    }

    func launchApplication() -> XCUIApplication {
        let actionsURL = createActionsFile()
        let app = application()
        app.launchArguments.append("--crosslog-ui-test")
        app.launchEnvironment["CROSSLOG_UI_TEST"] = "1"
        app.launchEnvironment["CROSSLOG_UI_TEST_ACTIONS_PATH"] = actionsURL.path
        app.launchEnvironment["CROSSLOG_UI_TEST_PERSIST_SESSION"] = "1"
        if let largeLogPath = largeLogFixturePath() {
            app.launchEnvironment["CROSSLOG_UI_TEST_LARGE_LOG_PATH"] = largeLogPath
        }
        app.launch()

        XCTAssertTrue(
            app.wait(for: .runningForeground, timeout: 10),
            "Crosslog Desktop app did not reach the foreground"
        )
        waitForUiTestTitle("state=empty", in: app)

        return app
    }

    func openSampleLogs(in app: XCUIApplication, file: StaticString = #filePath, line: UInt = #line) {
        let deadline = Date().addingTimeInterval(15)

        repeat {
            performUiTestAction(.openSampleLogs, file: file, line: line)

            if uiTestTitleContains("state=logs", in: app, timeout: 2)
                && uiTestTitleContains("panes=3", in: app, timeout: 2) {
                return
            }

            RunLoop.current.run(until: Date().addingTimeInterval(0.1))
        } while Date() < deadline

        waitForUiTestTitle("state=logs", in: app, timeout: 1, file: file, line: line)
    }

    func performUiTestAction(
        _ action: CrosslogUITestAction,
        file: StaticString = #filePath,
        line: UInt = #line
    ) {
        guard let actionsURL else {
            XCTFail("UI test actions file is not initialized", file: file, line: line)
            return
        }

        do {
            let handle = try FileHandle(forWritingTo: actionsURL)
            try handle.seekToEnd()
            try handle.write(contentsOf: Data("\(action.rawValue)\n".utf8))
            try handle.close()
        } catch {
            XCTFail("Failed to enqueue UI test action '\(action.rawValue)': \(error)", file: file, line: line)
            return
        }

        waitForUiTestActionQueueToDrain(action, file: file, line: line)
    }

    func enqueueUiTestActions(
        _ actions: [CrosslogUITestAction],
        file: StaticString = #filePath,
        line: UInt = #line
    ) {
        guard let actionsURL else {
            XCTFail("UI test actions file is not initialized", file: file, line: line)
            return
        }

        do {
            let handle = try FileHandle(forWritingTo: actionsURL)
            try handle.seekToEnd()
            try handle.write(contentsOf: Data(actions.map(\.rawValue).joined(separator: "\n").appending("\n").utf8))
            try handle.close()
        } catch {
            XCTFail("Failed to enqueue UI test actions: \(error)", file: file, line: line)
        }
    }

    private func waitForUiTestActionQueueToDrain(
        _ action: CrosslogUITestAction,
        timeout: TimeInterval = 5,
        file: StaticString = #filePath,
        line: UInt = #line
    ) {
        guard let actionsURL else {
            XCTFail("UI test actions file is not initialized", file: file, line: line)
            return
        }

        let deadline = Date().addingTimeInterval(timeout)

        while Date() < deadline {
            let contents = (try? String(contentsOf: actionsURL, encoding: .utf8)) ?? ""

            if !contents
                .components(separatedBy: .newlines)
                .map({ $0.trimmingCharacters(in: .whitespacesAndNewlines) })
                .contains(action.rawValue) {
                return
            }

            RunLoop.current.run(until: Date().addingTimeInterval(0.1))
        }

        XCTFail(
            "Expected UI test action '\(action.rawValue)' to be consumed",
            file: file,
            line: line
        )
    }

    func waitForUiTestTitle(
        _ fragment: String,
        in app: XCUIApplication,
        timeout: TimeInterval = 10,
        file: StaticString = #filePath,
        line: UInt = #line
    ) {
        let window = app.windows.firstMatch

        if uiTestTitleContains(fragment, in: app, timeout: timeout) {
            return
        }

        XCTFail(
            "Expected Crosslog UI test window title to contain '\(fragment)', actual title: '\(window.title)'",
            file: file,
            line: line
        )
    }

    private func uiTestTitleContains(
        _ fragment: String,
        in app: XCUIApplication,
        timeout: TimeInterval
    ) -> Bool {
        let deadline = Date().addingTimeInterval(timeout)
        let window = app.windows.firstMatch

        while Date() < deadline {
            if window.exists, window.title.contains(fragment) {
                return true
            }

            RunLoop.current.run(until: Date().addingTimeInterval(0.1))
        }

        return false
    }

    private func application() -> XCUIApplication {
        let bundleIdentifier =
            ProcessInfo.processInfo.environment["CROSSLOG_DESKTOP_APP_BUNDLE_ID"]
            ?? "dev.crosslog.desktop"

        return XCUIApplication(bundleIdentifier: bundleIdentifier)
    }

    private func createActionsFile() -> URL {
        let url = FileManager.default.temporaryDirectory
            .appendingPathComponent("crosslog-ui-actions-\(UUID().uuidString).txt")

        FileManager.default.createFile(atPath: url.path, contents: Data(), attributes: nil)
        actionsURL = url
        return url
    }

    private func largeLogFixturePath() -> String? {
        if let configuredPath = ProcessInfo.processInfo.environment["CROSSLOG_UI_TEST_LARGE_LOG_PATH"],
           !configuredPath.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return configuredPath
        }

        let sourceURL = URL(fileURLWithPath: #filePath)
        let repoRootURL = sourceURL
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()
        let fixtureURL = repoRootURL
            .appendingPathComponent("tests")
            .appendingPathComponent("fixtures")
            .appendingPathComponent("logs")
            .appendingPathComponent("idea.3.log")

        return FileManager.default.fileExists(atPath: fixtureURL.path) ? fixtureURL.path : nil
    }

    private func removeActionsFile() {
        guard let actionsURL else {
            return
        }

        try? FileManager.default.removeItem(at: actionsURL)
        self.actionsURL = nil
    }
}
