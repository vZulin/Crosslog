use std::{
    collections::HashMap,
    env, fs, io,
    path::PathBuf,
    sync::{Mutex, OnceLock},
};

const SUPPORTED_UI_TEST_ACTIONS: &[&str] = &[
    "resetWorkspace",
    "openSampleLogs",
    "openLargeLog",
    "copyFirstPane",
    "toggleSynchronization",
    "openSettings",
    "closeSettings",
    "setThemeSystem",
    "setThemeLight",
    "setThemeDark",
    "reorderFirstPaneAfterSecond",
    "dropNativeSampleSource",
    "keyboardNavigateActivePaneDown",
    "wheelNavigateActivePaneDown",
    "openActivePaneSearch",
    "setActivePaneSearchQuery",
    "setActivePaneInvalidSearch",
    "closeActivePaneSearch",
    "showFirstPaneCopyMenu",
    "dismissCopyMenu",
    "openEmptyDirectory",
    "navigatePreviousDirectoryFile",
    "navigateNextDirectoryFile",
    "discoverNewerDirectoryFile",
    "openActivePaneTimeOffset",
    "setActivePaneTimeOffset",
    "appendActiveFile",
    "deleteActiveFile",
    "replaceActiveFile",
];

#[tauri::command]
pub fn is_ui_test_mode() -> bool {
    ui_test_mode_enabled()
}

#[tauri::command]
pub fn ui_test_session_key() -> String {
    let suffix = env::var("CROSSLOG_UI_TEST_ACTIONS_PATH")
        .ok()
        .filter(|value| !value.trim().is_empty())
        .unwrap_or_else(|| "default".to_owned());

    format!("crosslog.ui-test.session.last-valid:{suffix}")
}

#[tauri::command]
pub fn ui_test_persistent_session_enabled() -> bool {
    env::var("CROSSLOG_UI_TEST_PERSIST_SESSION")
        .is_ok_and(|value| value == "1" || value.eq_ignore_ascii_case("true"))
}

#[tauri::command]
pub fn ui_test_large_log_path() -> Result<Option<String>, String> {
    if !ui_test_mode_enabled() {
        return Ok(None);
    }

    Ok(env::var("CROSSLOG_UI_TEST_LARGE_LOG_PATH")
        .ok()
        .map(|value| value.trim().to_owned())
        .filter(|value| !value.is_empty()))
}

#[tauri::command]
pub fn publish_ui_test_state(window: tauri::Window, state: String) -> Result<(), String> {
    if ui_test_mode_enabled() {
        window
            .set_title(&format!("Crosslog UI Test | {state}"))
            .map_err(|error| error.to_string())?;
    }

    Ok(())
}

#[tauri::command]
pub fn consume_ui_test_action() -> Result<Option<String>, String> {
    if !ui_test_mode_enabled() {
        return Ok(None);
    }

    let Some(actions_path) = env::var_os("CROSSLOG_UI_TEST_ACTIONS_PATH") else {
        return Ok(None);
    };
    let actions_path = PathBuf::from(actions_path);

    let contents = match fs::read_to_string(&actions_path) {
        Ok(value) => value,
        Err(error) if error.kind() == io::ErrorKind::NotFound => return Ok(None),
        Err(error) => return Err(error.to_string()),
    };
    let mut offsets = ui_test_action_offsets()
        .lock()
        .map_err(|_| "UI test action cursor lock poisoned.".to_owned())?;
    let offset = offsets.entry(actions_path).or_insert(0);

    Ok(consume_action_from_contents(&contents, offset))
}

pub(crate) fn ui_test_mode_enabled() -> bool {
    env::var("CROSSLOG_UI_TEST")
        .is_ok_and(|value| value == "1" || value.eq_ignore_ascii_case("true"))
        || env::args().any(|argument| argument == "--crosslog-ui-test")
}

fn supported_ui_test_action(action: &str) -> bool {
    SUPPORTED_UI_TEST_ACTIONS.contains(&action)
}

fn ui_test_action_offsets() -> &'static Mutex<HashMap<PathBuf, usize>> {
    static OFFSETS: OnceLock<Mutex<HashMap<PathBuf, usize>>> = OnceLock::new();

    OFFSETS.get_or_init(|| Mutex::new(HashMap::new()))
}

fn consume_action_from_contents(contents: &str, offset: &mut usize) -> Option<String> {
    if *offset > contents.len() {
        *offset = 0;
    }

    let unread_contents = contents.get(*offset..)?;

    for record in unread_contents.split_inclusive('\n') {
        let action = record.trim();

        // The writer may have appended a partial final line. Leave it for the
        // next poll instead of advancing the cursor past an incomplete action.
        if !record.ends_with('\n') {
            break;
        }

        *offset += record.len();

        if supported_ui_test_action(action) {
            return Some(action.to_owned());
        }
    }

    None
}

#[cfg(test)]
mod tests {
    use super::consume_action_from_contents;

    #[test]
    fn consumes_reset_workspace_from_the_action_queue() {
        let mut offset = 0;

        assert_eq!(
            consume_action_from_contents("resetWorkspace\nopenSampleLogs\n", &mut offset),
            Some("resetWorkspace".to_owned())
        );
        assert_eq!(offset, "resetWorkspace\n".len());
    }

    #[test]
    fn leaves_partial_actions_for_the_next_poll() {
        let mut offset = 0;

        assert_eq!(
            consume_action_from_contents("openSample", &mut offset),
            None
        );
        assert_eq!(offset, 0);
        assert_eq!(
            consume_action_from_contents("openSampleLogs\n", &mut offset),
            Some("openSampleLogs".to_owned())
        );
    }
}
