# macOS Desktop UI Harness

The macOS Desktop UI suite uses XCTest and Accessibility because the macOS
WebView does not expose the same Tauri WebDriver backend used on Windows and
Linux.

The repository includes a built-in Xcode project for the harness:

- `CrosslogDesktopUITests.xcodeproj`
- `CrosslogDesktopUITests` scheme
- `CrosslogUITestHost` host app target

Run the harness gate from the repository root through:

```bash
bash scripts/macos/test-ui.sh
```

The local gate builds the Crosslog macOS app bundle, builds the XCTest UI test
runner, clears local Gatekeeper extended attributes from build products,
re-signs the generated `.app` and `.xctest` bundles for local execution, and
executes `xcodebuild test-without-building`. Presence-only validation of Swift
files is not accepted as a release gate.

The WebView DOM is not exposed through macOS Accessibility in this harness.
Tests launch the real Tauri app, enqueue semantic UI actions through a temporary
file, let the React shell execute the matching DOM controls, and assert the
published window-title state through XCTest.

Override the built-in harness only when a different project or prebuilt bundle
is required:

- `CROSSLOG_MACOS_UI_XCTESTRUN=/path/to/harness.xctestrun`
- `CROSSLOG_MACOS_UI_XCODE_PROJECT=/path/to/project.xcodeproj`
  and `CROSSLOG_MACOS_UI_SCHEME=<scheme>`
- `CROSSLOG_MACOS_UI_XCODE_WORKSPACE=/path/to/workspace.xcworkspace`
  and `CROSSLOG_MACOS_UI_SCHEME=<scheme>`

Optional configuration:

- `CROSSLOG_MACOS_UI_DESTINATION`, defaulting to `platform=macOS`
- `CROSSLOG_MACOS_UI_DERIVED_DATA`, defaulting to `.build/crosslog-macos-ui-derived-data`
- `CROSSLOG_DESKTOP_APP_BUNDLE_PATH`
- `CROSSLOG_DESKTOP_APP_BUNDLE_ID`
- `CROSSLOG_MACOS_UI_SKIP_APP_BUILD=true` when reusing an existing app bundle
