# macOS Desktop UI Harness

The macOS Desktop UI suite uses XCTest and Accessibility because the macOS
WebView does not expose the same Tauri WebDriver backend used on Windows and
Linux.

Run the harness from the repository root through:

```bash
bash scripts/macos/test-ui.sh
```

The runner expects Xcode command line tools and a built Crosslog Desktop app.

