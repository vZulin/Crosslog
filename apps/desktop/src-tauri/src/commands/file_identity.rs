use serde::Serialize;
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileIdentityPayload {
    pub identity: String,
    pub size_bytes: u64,
}

#[tauri::command]
pub fn get_file_identity(path: PathBuf) -> Result<FileIdentityPayload, String> {
    let metadata = fs::metadata(&path).map_err(|error| error.to_string())?;

    Ok(FileIdentityPayload {
        identity: build_identity(&path, &metadata),
        size_bytes: metadata.len(),
    })
}

pub fn build_identity(path: &PathBuf, metadata: &fs::Metadata) -> String {
    platform_identity(path, metadata)
}

#[cfg(unix)]
fn platform_identity(_path: &PathBuf, metadata: &fs::Metadata) -> String {
    use std::os::unix::fs::MetadataExt;

    format!("unix:{}:{}", metadata.dev(), metadata.ino())
}

#[cfg(windows)]
fn platform_identity(path: &PathBuf, metadata: &fs::Metadata) -> String {
    use std::os::windows::fs::MetadataExt;

    format!("windows:{}:{}", path.display(), metadata.creation_time())
}

#[cfg(not(any(unix, windows)))]
fn platform_identity(path: &PathBuf, metadata: &fs::Metadata) -> String {
    let modified_ms = metadata
        .modified()
        .ok()
        .and_then(|time| time.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|duration| duration.as_millis())
        .unwrap_or_default();

    format!(
        "fallback:{}:{}:{}",
        path.display(),
        metadata.len(),
        modified_ms
    )
}

#[cfg(test)]
mod tests {
    use super::get_file_identity;
    use std::fs;
    use tempfile::tempdir;

    #[test]
    fn reports_stable_identity_for_existing_file() {
        let directory = tempdir().expect("create temporary directory");
        let file_path = directory.path().join("app.log");
        fs::write(&file_path, "line").expect("write fixture file");

        let first = get_file_identity(file_path.clone()).expect("read first identity");
        let second = get_file_identity(file_path).expect("read second identity");

        assert_eq!(first.identity, second.identity);
        assert_eq!(first.size_bytes, 4);
    }
}
