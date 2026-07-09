use serde::Serialize;
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileMetadata {
    pub display_name: String,
    pub size_bytes: u64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileContent {
    pub display_name: String,
    pub size_bytes: u64,
    pub lines: Vec<String>,
}

#[tauri::command]
pub fn read_file_metadata(path: PathBuf) -> Result<FileMetadata, String> {
    let metadata = fs::metadata(&path).map_err(|error| error.to_string())?;
    let display_name = path
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or("Untitled log")
        .to_owned();

    Ok(FileMetadata {
        display_name,
        size_bytes: metadata.len(),
    })
}

/// Read a log file's decoded lines for a read-only open. Logs are treated as
/// inert, read-only input; this only reads, never writes.
#[tauri::command]
pub fn read_log_file(path: PathBuf) -> Result<FileContent, String> {
    let metadata = fs::metadata(&path).map_err(|error| error.to_string())?;
    let content = fs::read_to_string(&path).map_err(|error| error.to_string())?;
    let display_name = path
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or("Untitled log")
        .to_owned();
    let lines = content
        .lines()
        .filter(|line| !line.is_empty())
        .map(ToOwned::to_owned)
        .collect();

    Ok(FileContent {
        display_name,
        size_bytes: metadata.len(),
        lines,
    })
}

#[cfg(test)]
mod tests {
    use super::read_log_file;
    use std::fs;
    use tempfile::tempdir;

    #[test]
    fn reads_decoded_non_empty_lines_from_a_log_file() {
        let directory = tempdir().expect("create temporary directory");
        let file_path = directory.path().join("app.log");
        fs::write(&file_path, "first line\n\nsecond line\n").expect("write fixture");

        let content = read_log_file(file_path).expect("read log file");

        assert_eq!(content.display_name, "app.log");
        assert_eq!(
            content.lines,
            vec!["first line".to_owned(), "second line".to_owned()]
        );
        assert!(content.size_bytes > 0);
    }

    #[test]
    fn returns_an_error_for_a_missing_file() {
        let directory = tempdir().expect("create temporary directory");
        let missing = directory.path().join("missing.log");

        assert!(read_log_file(missing).is_err());
    }
}
