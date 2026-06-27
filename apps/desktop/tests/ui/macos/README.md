# macOS Desktop UI Harness

The macOS Desktop UI suite uses XCTest and Accessibility because the macOS
WebView does not expose the same Tauri WebDriver backend used on Windows and
Linux.

Run the harness gate from the repository root through:

```bash
bash scripts/macos/test-ui.sh
```

The local gate must execute a real XCTest UI run. Configure one of these before
running it:

- `CROSSLOG_MACOS_UI_XCTESTRUN=/path/to/harness.xctestrun`
- `CROSSLOG_MACOS_UI_XCODE_PROJECT=/path/to/project.xcodeproj`
  and `CROSSLOG_MACOS_UI_SCHEME=<scheme>`
- `CROSSLOG_MACOS_UI_XCODE_WORKSPACE=/path/to/workspace.xcworkspace`
  and `CROSSLOG_MACOS_UI_SCHEME=<scheme>`

Optional configuration:

- `CROSSLOG_MACOS_UI_DESTINATION`, defaulting to `platform=macOS`
- `CROSSLOG_MACOS_UI_DERIVED_DATA`

Presence-only validation of Swift files is not accepted as a release gate.
