import Foundation
import XCTest

enum CrosslogUITestAction: String {
    case openSampleLogs
    case copyFirstPane
    case toggleSynchronization
    case reorderFirstPaneAfterSecond
    case keyboardNavigateActivePaneDown
    case wheelNavigateActivePaneDown
    case openActivePaneSearch
    case setActivePaneInvalidSearch
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
        app.launch()

        XCTAssertTrue(
            app.wait(for: .runningForeground, timeout: 10),
            "Crosslog Desktop app did not reach the foreground"
        )
        waitForUiTestTitle("state=empty", in: app)

        return app
    }

    func openSampleLogs(in app: XCUIApplication, file: StaticString = #filePath, line: UInt = #line) {
        performUiTestAction(.openSampleLogs, file: file, line: line)
        waitForUiTestTitle("state=logs", in: app, file: file, line: line)
        waitForUiTestTitle("panes=3", in: app, file: file, line: line)
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
        let deadline = Date().addingTimeInterval(timeout)
        let window = app.windows.firstMatch

        while Date() < deadline {
            if window.exists, window.title.contains(fragment) {
                return
            }

            RunLoop.current.run(until: Date().addingTimeInterval(0.1))
        }

        XCTFail(
            "Expected Crosslog UI test window title to contain '\(fragment)', actual title: '\(window.title)'",
            file: file,
            line: line
        )
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

    private func removeActionsFile() {
        guard let actionsURL else {
            return
        }

        try? FileManager.default.removeItem(at: actionsURL)
        self.actionsURL = nil
    }
}
