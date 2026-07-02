use serde::Serialize;
use std::fs;
use std::path::PathBuf;

/// The kind of filesystem entry a dropped path refers to. `missing` covers a
/// path that no longer resolves (deleted between the OS drop and classification)
/// or that the process cannot stat.
#[derive(Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ClassifiedDroppedPath {
    pub path: String,
    pub kind: DroppedPathKind,
    pub name: String,
}

#[derive(Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum DroppedPathKind {
    File,
    Directory,
    Missing,
}

/// Classify native OS drag-and-drop payload paths as files or directories so the
/// platform adapter can build the correct source refs. Logs are opened read-only
/// elsewhere; this command only inspects filesystem metadata and never mutates.
#[tauri::command]
pub fn classify_dropped_paths(paths: Vec<PathBuf>) -> Vec<ClassifiedDroppedPath> {
    paths.into_iter().map(|path| classify_path(path)).collect()
}

fn classify_path(path: PathBuf) -> ClassifiedDroppedPath {
    let name = path
        .file_name()
        .and_then(|value| value.to_str())
        .map(|value| value.to_owned())
        .unwrap_or_else(|| path.to_string_lossy().to_string());
    let path_string = path.to_string_lossy().to_string();

    let kind = match fs::metadata(&path) {
        Ok(metadata) if metadata.is_dir() => DroppedPathKind::Directory,
        Ok(metadata) if metadata.is_file() => DroppedPathKind::File,
        _ => DroppedPathKind::Missing,
    };

    ClassifiedDroppedPath {
        path: path_string,
        kind,
        name,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs::File;
    use tempfile::tempdir;

    #[test]
    fn classifies_files_directories_and_missing_paths() {
        let dir = tempdir().expect("temp dir");
        let file_path = dir.path().join("app.log");
        File::create(&file_path).expect("create file");
        let missing_path = dir.path().join("does-not-exist.log");

        let classified = classify_dropped_paths(vec![
            file_path.clone(),
            dir.path().to_path_buf(),
            missing_path.clone(),
        ]);

        assert_eq!(classified[0].kind, DroppedPathKind::File);
        assert_eq!(classified[0].name, "app.log");
        assert_eq!(classified[1].kind, DroppedPathKind::Directory);
        assert_eq!(classified[2].kind, DroppedPathKind::Missing);
    }
}
