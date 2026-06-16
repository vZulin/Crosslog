use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::UNIX_EPOCH;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DirectoryFileMetadata {
    pub identity: String,
    pub name: String,
    pub created_at_ms: Option<u128>,
    pub size_bytes: u64,
}

#[tauri::command]
pub fn list_top_level_directory_files(path: PathBuf) -> Result<Vec<DirectoryFileMetadata>, String> {
    read_top_level_directory_files(&path)
}

#[tauri::command]
pub fn refresh_directory_files(path: PathBuf) -> Result<Vec<DirectoryFileMetadata>, String> {
    read_top_level_directory_files(&path)
}

fn read_top_level_directory_files(path: &Path) -> Result<Vec<DirectoryFileMetadata>, String> {
    let mut files = Vec::new();

    for entry_result in fs::read_dir(path).map_err(|error| error.to_string())? {
        let entry = entry_result.map_err(|error| error.to_string())?;
        let metadata = entry.metadata().map_err(|error| error.to_string())?;

        if !metadata.is_file() {
            continue;
        }

        let entry_path = entry.path();
        let name = entry_path
            .file_name()
            .and_then(|value| value.to_str())
            .unwrap_or("Untitled log")
            .to_owned();
        let created_at_ms = metadata
            .created()
            .ok()
            .and_then(|created| created.duration_since(UNIX_EPOCH).ok())
            .map(|duration| duration.as_millis());
        let modified_at_ms = metadata
            .modified()
            .ok()
            .and_then(|modified| modified.duration_since(UNIX_EPOCH).ok())
            .map(|duration| duration.as_millis())
            .unwrap_or(0);
        let canonical_path = entry_path
            .canonicalize()
            .unwrap_or(entry_path)
            .to_string_lossy()
            .to_string();

        files.push(DirectoryFileMetadata {
            identity: format!("{}:{}:{}", canonical_path, metadata.len(), modified_at_ms),
            name,
            created_at_ms,
            size_bytes: metadata.len(),
        });
    }

    files.sort_by(|left, right| {
        right
            .created_at_ms
            .cmp(&left.created_at_ms)
            .then_with(|| right.name.cmp(&left.name))
            .then_with(|| right.identity.cmp(&left.identity))
    });

    Ok(files)
}
