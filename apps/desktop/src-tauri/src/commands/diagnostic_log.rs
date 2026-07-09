use serde::{Deserialize, Serialize};
use serde_json::{json, Map, Value};
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Manager};
use thiserror::Error;

#[cfg(not(target_os = "macos"))]
const APP_DATA_LOG_DIR: &str = "logs";
#[cfg(target_os = "macos")]
const USER_LOG_DIR: &str = "Logs";
#[cfg(target_os = "macos")]
const USER_LOG_APP_DIR: &str = "Crosslog";
const LOG_FILE: &str = "crosslog-desktop.jsonl";
const ROTATED_LOG_FILE: &str = "crosslog-desktop.1.jsonl";
const MAX_LOG_FILE_BYTES: u64 = 5 * 1024 * 1024;

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiagnosticLogEvent {
    pub timestamp: String,
    pub level: String,
    pub name: String,
    #[serde(default)]
    pub fields: Option<Value>,
}

#[derive(Debug, Error)]
pub enum DiagnosticLogError {
    #[error("failed to resolve diagnostic log directory")]
    DiagnosticLogDirectory,
    #[error("diagnostic log I/O failed: {0}")]
    Io(#[from] std::io::Error),
    #[error("diagnostic log JSON is invalid: {0}")]
    Json(#[from] serde_json::Error),
}

#[tauri::command]
pub fn write_diagnostic_log(app: AppHandle, event: DiagnosticLogEvent) -> Result<(), String> {
    write_diagnostic_log_to_dir(&diagnostic_log_dir(&app)?, &event)
        .map(|_| ())
        .map_err(|error| error.to_string())
}

pub fn write_diagnostic_log_to_dir(
    log_dir: &Path,
    event: &DiagnosticLogEvent,
) -> Result<PathBuf, DiagnosticLogError> {
    fs::create_dir_all(log_dir)?;

    let log_path = log_dir.join(LOG_FILE);
    rotate_log_file(&log_path, MAX_LOG_FILE_BYTES)?;

    let serialized = serde_json::to_vec(&create_log_record(event))?;
    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_path)?;

    file.write_all(&serialized)?;
    file.write_all(b"\n")?;
    file.flush()?;

    Ok(log_path)
}

#[cfg(target_os = "macos")]
fn diagnostic_log_dir(app: &AppHandle) -> Result<PathBuf, String> {
    app.path()
        .home_dir()
        .map(|path| diagnostic_log_dir_from_home(&path))
        .map_err(|_| DiagnosticLogError::DiagnosticLogDirectory.to_string())
}

#[cfg(target_os = "macos")]
fn diagnostic_log_dir_from_home(home_dir: &Path) -> PathBuf {
    home_dir.join(USER_LOG_DIR).join(USER_LOG_APP_DIR)
}

#[cfg(not(target_os = "macos"))]
fn diagnostic_log_dir(app: &AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_data_dir()
        .map(|path| diagnostic_log_dir_from_app_data(&path))
        .map_err(|_| DiagnosticLogError::DiagnosticLogDirectory.to_string())
}

#[cfg(not(target_os = "macos"))]
fn diagnostic_log_dir_from_app_data(app_data_dir: &Path) -> PathBuf {
    app_data_dir.join(APP_DATA_LOG_DIR)
}

fn create_log_record(event: &DiagnosticLogEvent) -> Value {
    let mut record = Map::new();

    record.insert("receivedAtUnixMs".to_owned(), json!(current_unix_time_ms()));
    record.insert("timestamp".to_owned(), json!(event.timestamp));
    record.insert("level".to_owned(), json!(event.level));
    record.insert("name".to_owned(), json!(event.name));

    if let Some(fields) = &event.fields {
        record.insert("fields".to_owned(), fields.clone());
    }

    Value::Object(record)
}

fn rotate_log_file(log_path: &Path, max_bytes: u64) -> Result<(), std::io::Error> {
    let metadata = match fs::metadata(log_path) {
        Ok(metadata) => metadata,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(()),
        Err(error) => return Err(error),
    };

    if metadata.len() < max_bytes {
        return Ok(());
    }

    let rotated_log_path = log_path.with_file_name(ROTATED_LOG_FILE);

    match fs::remove_file(&rotated_log_path) {
        Ok(()) => {}
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => {}
        Err(error) => return Err(error),
    }

    fs::rename(log_path, rotated_log_path)
}

fn current_unix_time_ms() -> u128 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_millis())
        .unwrap_or(0)
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    use tempfile::tempdir;

    #[test]
    fn appends_json_lines_to_the_diagnostic_log() {
        let directory = tempdir().expect("create temporary directory");
        let event = DiagnosticLogEvent {
            timestamp: "2026-07-09T10:00:00.000Z".to_owned(),
            level: "info".to_owned(),
            name: "desktop.pane.opened".to_owned(),
            fields: Some(json!({
                "paneId": "pane-1",
                "path": "/tmp/app.log",
                "activePaneCountAfter": 1
            })),
        };

        let log_path =
            write_diagnostic_log_to_dir(directory.path(), &event).expect("write diagnostic log");
        let contents = fs::read_to_string(log_path).expect("read diagnostic log");
        let records = contents
            .lines()
            .map(|line| serde_json::from_str::<Value>(line).expect("parse json line"))
            .collect::<Vec<_>>();

        assert_eq!(records.len(), 1);
        assert_eq!(records[0]["timestamp"], "2026-07-09T10:00:00.000Z");
        assert_eq!(records[0]["level"], "info");
        assert_eq!(records[0]["name"], "desktop.pane.opened");
        assert_eq!(records[0]["fields"]["path"], "/tmp/app.log");
        assert!(records[0]["receivedAtUnixMs"].as_u64().is_some());
    }

    #[cfg(target_os = "macos")]
    #[test]
    fn resolves_macos_diagnostic_log_dir_under_user_logs() {
        let home_dir = PathBuf::from("/Users/crosslog");

        assert_eq!(
            diagnostic_log_dir_from_home(&home_dir),
            PathBuf::from("/Users/crosslog/Logs/Crosslog")
        );
    }

    #[cfg(not(target_os = "macos"))]
    #[test]
    fn resolves_non_macos_diagnostic_log_dir_under_app_data() {
        let app_data_dir = PathBuf::from("crosslog-app-data");

        assert_eq!(
            diagnostic_log_dir_from_app_data(&app_data_dir),
            app_data_dir.join("logs")
        );
    }

    #[test]
    fn rotates_the_current_log_before_appending_when_it_exceeds_the_limit() {
        let directory = tempdir().expect("create temporary directory");
        let log_path = directory.path().join(LOG_FILE);
        fs::write(&log_path, "old diagnostic data").expect("write old log");

        rotate_log_file(&log_path, 4).expect("rotate log");

        assert!(!log_path.exists());
        assert_eq!(
            fs::read_to_string(directory.path().join(ROTATED_LOG_FILE)).expect("read rotated log"),
            "old diagnostic data"
        );
    }
}
