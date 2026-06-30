import XCTest

final class SettingsThemeUITests: CrosslogUITests {
    func testSettingsThemeWorkflowPreservesAnalysisState() {
        let app = launchApplication()

        waitForUiTestTitle("themePreference=system", in: app)
        waitForUiTestTitle("settingsSurface=closed", in: app)

        performUiTestAction(.openSettings)
        RedesignedShellAssertions.assertSettingsSurfaceOpen(in: app)

        performUiTestAction(.setThemeLight)
        waitForUiTestTitle("themePreference=light", in: app)
        waitForUiTestTitle("theme=light", in: app)

        openSampleLogs(in: app)
        performUiTestAction(.openActivePaneSearch)
        waitForUiTestTitle("search=open", in: app)
        performUiTestAction(.toggleSynchronization)
        waitForUiTestTitle("sync=off", in: app)

        performUiTestAction(.setThemeDark)
        waitForUiTestTitle("themePreference=dark", in: app)
        waitForUiTestTitle("theme=dark", in: app)
        waitForUiTestTitle("panes=3", in: app)
        waitForUiTestTitle("search=open", in: app)
        waitForUiTestTitle("sync=off", in: app)
        waitForUiTestTitle("syncVisual=inactive", in: app)
        waitForUiTestTitle("syncPressed=off", in: app)

        performUiTestAction(.closeSettings)
        waitForUiTestTitle("settingsSurface=closed", in: app)
    }
}
