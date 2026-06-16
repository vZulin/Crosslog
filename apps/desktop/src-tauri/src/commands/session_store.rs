use serde_json::Value;
use std::fs;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};
use thiserror::Error;

const LAST_VALID_FILE: &str = "session.last-valid.json";
const PENDING_FILE: &str = "session.pending.json";
const TEMP_FILE: &str = "session.last-valid.json.tmp";

#[derive(Debug, Error)]
pub enum SessionStoreError {
    #[error("failed to resolve session directory")]
    SessionDirectory,
    #[error("session store I/O failed: {0}")]
    Io(#[from] std::io::Error),
    #[error("session JSON is invalid: {0}")]
    Json(#[from] serde_json::Error),
}

#[tauri::command]
pub fn load_last_valid_session(app: AppHandle) -> Result<Option<Value>, String> {
    read_last_valid_session_from_dir(&session_dir(&app)?).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn write_session_snapshot(app: AppHandle, session: Value) -> Result<(), String> {
    write_session_snapshot_to_dir(&session_dir(&app)?, &session).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn recover_session(app: AppHandle) -> Result<Option<Value>, String> {
    recover_session_from_dir(&session_dir(&app)?).map_err(|error| error.to_string())
}

pub fn write_session_snapshot_to_dir(
    session_dir: &Path,
    session: &Value,
) -> Result<(), SessionStoreError> {
    fs::create_dir_all(session_dir)?;

    let serialized = serde_json::to_vec_pretty(session)?;
    let pending_path = session_dir.join(PENDING_FILE);
    let temp_path = session_dir.join(TEMP_FILE);
    let last_valid_path = session_dir.join(LAST_VALID_FILE);

    fs::write(&pending_path, &serialized)?;
    let pending = fs::read(&pending_path)?;
    serde_json::from_slice::<Value>(&pending)?;

    fs::write(&temp_path, &pending)?;
    fs::rename(&temp_path, &last_valid_path)?;

    match fs::remove_file(&pending_path) {
        Ok(()) => Ok(()),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(()),
        Err(error) => Err(SessionStoreError::Io(error)),
    }
}

pub fn read_last_valid_session_from_dir(
    session_dir: &Path,
) -> Result<Option<Value>, SessionStoreError> {
    let path = session_dir.join(LAST_VALID_FILE);

    if !path.exists() {
        return Ok(None);
    }

    let data = fs::read(path)?;
    Ok(Some(serde_json::from_slice(&data)?))
}

pub fn recover_session_from_dir(session_dir: &Path) -> Result<Option<Value>, SessionStoreError> {
    match read_last_valid_session_from_dir(session_dir) {
        Ok(session) => Ok(session),
        Err(SessionStoreError::Json(_)) => Ok(None),
        Err(error) => Err(error),
    }
}

fn session_dir(app: &AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_data_dir()
        .map_err(|_| SessionStoreError::SessionDirectory.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    use tempfile::tempdir;

    #[test]
    fn writes_last_valid_session_and_removes_pending_snapshot() {
        let dir = tempdir().expect("tempdir");
        let session = json!({ "schemaVersion": 1, "panes": [], "paneSizes": {}, "sources": [], "directorySelections": {}, "futureExtensions": {} });

        write_session_snapshot_to_dir(dir.path(), &session).expect("write session");

        assert!(dir.path().join(LAST_VALID_FILE).exists());
        assert!(!dir.path().join(PENDING_FILE).exists());
        assert_eq!(
            read_last_valid_session_from_dir(dir.path()).expect("read session"),
            Some(session),
        );
    }

    #[test]
    fn recovers_last_valid_session_when_pending_snapshot_is_corrupt() {
        let dir = tempdir().expect("tempdir");
        let session = json!({ "schemaVersion": 1, "panes": [], "paneSizes": {}, "sources": [], "directorySelections": {}, "futureExtensions": {} });

        write_session_snapshot_to_dir(dir.path(), &session).expect("write session");
        fs::write(dir.path().join(PENDING_FILE), b"{").expect("write corrupt pending");

        assert_eq!(
            recover_session_from_dir(dir.path()).expect("recover"),
            Some(session)
        );
    }
}
