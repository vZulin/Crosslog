use crate::commands::file_identity::build_identity;
use serde::Serialize;
use std::fs::{self, File};
use std::io::{Read, Seek, SeekFrom};
use std::path::PathBuf;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileWatcherPayload {
    pub kind: String,
    pub source_id: String,
    pub identity: Option<String>,
    pub size_bytes: Option<u64>,
    pub lines: Vec<String>,
    pub message: Option<String>,
}

#[tauri::command]
pub fn classify_file_snapshot(
    path: PathBuf,
    previous_identity: String,
    previous_size_bytes: u64,
) -> Result<FileWatcherPayload, String> {
    let source_id = path.to_string_lossy().to_string();
    let metadata = match fs::metadata(&path) {
        Ok(metadata) => metadata,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
            return Ok(FileWatcherPayload {
                kind: "deleted".to_owned(),
                source_id,
                identity: None,
                size_bytes: None,
                lines: Vec::new(),
                message: None,
            });
        }
        Err(error) => return Err(error.to_string()),
    };

    let identity = build_identity(&path, &metadata);
    if identity != previous_identity {
        let lines = read_all_lines(&path)?;

        return Ok(FileWatcherPayload {
            kind: "replaced".to_owned(),
            source_id,
            identity: Some(identity),
            size_bytes: Some(metadata.len()),
            lines,
            message: None,
        });
    }

    if metadata.len() > previous_size_bytes {
        let lines = read_lines_from_offset(&path, previous_size_bytes)?;

        return Ok(FileWatcherPayload {
            kind: "appended".to_owned(),
            source_id,
            identity: Some(identity),
            size_bytes: Some(metadata.len()),
            lines,
            message: None,
        });
    }

    Ok(FileWatcherPayload {
        kind: "unchanged".to_owned(),
        source_id,
        identity: Some(identity),
        size_bytes: Some(metadata.len()),
        lines: Vec::new(),
        message: None,
    })
}

fn read_all_lines(path: &PathBuf) -> Result<Vec<String>, String> {
    let content = fs::read_to_string(path).map_err(|error| error.to_string())?;

    Ok(split_lines(&content))
}

fn read_lines_from_offset(path: &PathBuf, offset: u64) -> Result<Vec<String>, String> {
    let mut file = File::open(path).map_err(|error| error.to_string())?;
    file.seek(SeekFrom::Start(offset))
        .map_err(|error| error.to_string())?;
    let mut content = String::new();
    file.read_to_string(&mut content)
        .map_err(|error| error.to_string())?;

    Ok(split_lines(&content))
}

fn split_lines(content: &str) -> Vec<String> {
    content
        .lines()
        .filter(|line| !line.is_empty())
        .map(ToOwned::to_owned)
        .collect()
}

#[cfg(test)]
mod tests {
    use super::classify_file_snapshot;
    use crate::commands::file_identity::get_file_identity;
    use std::fs;
    use tempfile::tempdir;

    #[test]
    fn classifies_append_without_rewriting_the_file() {
        let directory = tempdir().expect("create temporary directory");
        let file_path = directory.path().join("app.log");
        fs::write(&file_path, "first\n").expect("write fixture");
        let identity = get_file_identity(file_path.clone()).expect("read identity");
        fs::write(&file_path, "first\nsecond\n").expect("append fixture through test setup");

        let event = classify_file_snapshot(file_path, identity.identity, identity.size_bytes)
            .expect("classify file snapshot");

        assert_eq!(event.kind, "appended");
        assert_eq!(event.lines, vec!["second".to_owned()]);
    }
}
