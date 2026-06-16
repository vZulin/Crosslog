# Crosslog Icon Set

This directory is the release iconset handoff point for generated Crosslog
icons.

## Source

- Canonical vector: `crosslog-icon.svg`
- Existing generated app icons: `apps/desktop/src-tauri/icons/`
- Release documentation: `assets/icons/README.md`

## Required Outputs

The release icon pipeline must keep the two-pane log motif and synchronization
crossing lines from the canonical SVG and generate platform assets for:

- macOS `.icns`
- Windows `.ico`
- PNG sizes required by Tauri
- Store/logo PNG variants required by Windows packaging

## Validation

- Generated icons must be committed only after visual inspection.
- The iconset must not introduce decorative variants that obscure the source
  motif.
- App packaging should reference the generated assets through
  `apps/desktop/src-tauri/tauri.conf.json`.
