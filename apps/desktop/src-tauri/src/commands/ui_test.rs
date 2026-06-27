use std::{env, fs, io};

#[tauri::command]
pub fn is_ui_test_mode() -> bool {
    ui_test_mode_enabled()
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
    let mut actions = contents
        .lines()
        .map(str::trim)
        .filter(|line| !line.is_empty());

    let Some(action) = actions.next() else {
        return Ok(None);
    };

    let remaining_actions = actions.collect::<Vec<_>>();
    let remaining_contents = if remaining_actions.is_empty() {
        String::new()
    } else {
        format!("{}\n", remaining_actions.join("\n"))
    };

    fs::write(actions_path, remaining_contents).map_err(|error| error.to_string())?;

    Ok(Some(action.to_owned()))
}

pub(crate) fn ui_test_mode_enabled() -> bool {
    env::var("CROSSLOG_UI_TEST")
        .is_ok_and(|value| value == "1" || value.eq_ignore_ascii_case("true"))
        || env::args().any(|argument| argument == "--crosslog-ui-test")
}
