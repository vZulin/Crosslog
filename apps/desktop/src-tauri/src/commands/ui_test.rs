use std::{env, fs, io};

const SUPPORTED_UI_TEST_ACTIONS: &[&str] = &[
    "openSampleLogs",
    "copyFirstPane",
    "toggleSynchronization",
    "reorderFirstPaneAfterSecond",
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

    let contents = match fs::read_to_string(&actions_path) {
        Ok(value) => value,
        Err(error) if error.kind() == io::ErrorKind::NotFound => return Ok(None),
        Err(error) => return Err(error.to_string()),
    };
    let actions = contents
        .lines()
        .map(str::trim)
        .filter(|line| !line.is_empty())
        .collect::<Vec<_>>();

    let Some((action_index, action)) = actions
        .iter()
        .enumerate()
        .find(|(_, action)| supported_ui_test_action(action))
    else {
        fs::write(actions_path, String::new()).map_err(|error| error.to_string())?;
        return Ok(None);
    };

    let remaining_actions = actions
        .iter()
        .enumerate()
        .filter_map(|(index, remaining_action)| {
            if index > action_index {
                Some(*remaining_action)
            } else {
                None
            }
        })
        .collect::<Vec<_>>();
    let remaining_contents = if remaining_actions.is_empty() {
        String::new()
    } else {
        format!("{}\n", remaining_actions.join("\n"))
    };

    fs::write(actions_path, remaining_contents).map_err(|error| error.to_string())?;

    Ok(Some((*action).to_owned()))
}

pub(crate) fn ui_test_mode_enabled() -> bool {
    env::var("CROSSLOG_UI_TEST")
        .is_ok_and(|value| value == "1" || value.eq_ignore_ascii_case("true"))
        || env::args().any(|argument| argument == "--crosslog-ui-test")
}

fn supported_ui_test_action(action: &str) -> bool {
    SUPPORTED_UI_TEST_ACTIONS.contains(&action)
}
