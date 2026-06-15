use serde::Serialize;
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileMetadata {
    pub display_name: String,
    pub size_bytes: u64,
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

