import Foundation
import XCTest

enum CrosslogUITestAction: String {
    case openSampleLogs
    case copyFirstPane
    case toggleSynchronization
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
            let currentContents = (try? String(contentsOf: actionsURL, encoding: .utf8)) ?? ""
            try (currentContents + action.rawValue + "\n").write(to: actionsURL, atomically: true, encoding: .utf8)
        } catch {
            XCTFail("Failed to enqueue UI test action '\(action.rawValue)': \(error)", file: file, line: line)
        }
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
