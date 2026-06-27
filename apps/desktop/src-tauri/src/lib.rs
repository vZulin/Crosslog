pub mod commands;
pub mod events;

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::file_watcher::classify_file_snapshot,
            commands::directory_access::list_top_level_directory_files,
            commands::directory_access::refresh_directory_files,
            commands::file_identity::get_file_identity,
            commands::file_access::read_file_metadata,
            commands::session_store::load_last_valid_session,
            commands::session_store::write_session_snapshot,
            commands::session_store::recover_session,
            commands::ui_test::is_ui_test_mode,
            commands::ui_test::publish_ui_test_state,
            commands::ui_test::consume_ui_test_action
        ])
        .run(tauri::generate_context!())
        .expect("failed to run Crosslog desktop shell");
}
