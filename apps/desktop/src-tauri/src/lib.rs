pub mod commands;
pub mod events;

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::file_access::read_file_metadata
        ])
        .run(tauri::generate_context!())
        .expect("failed to run Crosslog desktop shell");
}

