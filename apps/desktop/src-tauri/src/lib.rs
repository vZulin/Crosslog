pub mod commands;
pub mod events;

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::file_watcher::classify_file_snapshot,
            commands::directory_access::list_top_level_directory_files,
            commands::directory_access::refresh_directory_files,
            commands::file_identity::get_file_identity,
            commands::file_access::read_file_metadata
        ])
        .run(tauri::generate_context!())
        .expect("failed to run Crosslog desktop shell");
}
