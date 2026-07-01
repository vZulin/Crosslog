import XCTest

final class SessionRestoreUITests: CrosslogUITests {
    func testSessionRestoreKeepsRedesignedShellStateAfterRelaunch() {
        let app = launchApplication()

        openSampleLogs(in: app)
        RedesignedShellAssertions.assertRequiredRegions(in: app)
        RedesignedShellAssertions.assertObsoleteControlsAbsent(in: app)
        performUiTestAction(.navigateNextDirectoryFile)
        waitForUiTestTitle("directoryFile=app-2026-06-15.log", in: app)
        performUiTestAction(.openActivePaneTimeOffset)
        waitForUiTestTitle("timeOffset=open", in: app)
        performUiTestAction(.setActivePaneTimeOffset)
        waitForUiTestTitle("activeOffset=+1m", in: app)
        performUiTestAction(.toggleSynchronization)
        waitForUiTestTitle("sync=off", in: app)
        waitForUiTestTitle("session=written", in: app)

        app.terminate()
        app.launch()

        XCTAssertTrue(
            app.wait(for: .runningForeground, timeout: 10),
            "Crosslog Desktop app did not relaunch into the foreground"
        )
        waitForUiTestTitle("state=logs", in: app)
        waitForUiTestTitle("panes=3", in: app)
        waitForUiTestTitle("sync=off", in: app)
        waitForUiTestTitle("activeOffset=+1m", in: app)
        waitForUiTestTitle("directoryFile=app-2026-06-15.log", in: app)
        waitForUiTestTitle("files=app.log,service.log,app-2026-06-15.log", in: app)
        waitForUiTestTitle("active=app-2026-06-15.log", in: app)

        RedesignedShellAssertions.assertRequiredRegions(in: app)
        RedesignedShellAssertions.assertObsoleteControlsAbsent(in: app)
        RedesignedShellAssertions.assertPaneCount(3, in: app)
        RedesignedShellAssertions.assertStatusContains("3 panes", in: app)
        RedesignedShellAssertions.assertStatusContains("Sync off", in: app)
    }
}
