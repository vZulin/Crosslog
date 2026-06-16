# macOS Desktop UI Harness

The macOS Desktop UI suite uses XCTest and Accessibility because the macOS
WebView does not expose the same Tauri WebDriver backend used on Windows and
Linux.

Run the harness gate from the repository root through:

```bash
bash scripts/macos/test-ui.sh
```

The local gate validates that the macOS XCTest harness files exist and remain
XCTest-based. Full execution requires an Xcode UI test target and a built
Crosslog Desktop app in the target macOS validation environment.
