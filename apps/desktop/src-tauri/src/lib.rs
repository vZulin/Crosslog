pub mod commands;
pub mod events;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::diagnostic_log::write_diagnostic_log,
            commands::file_watcher::classify_file_snapshot,
            commands::directory_access::list_top_level_directory_files,
            commands::directory_access::refresh_directory_files,
            commands::drag_drop::classify_dropped_paths,
            commands::file_identity::get_file_identity,
            commands::file_access::read_file_metadata,
            commands::file_access::read_log_file,
            commands::session_store::load_last_valid_session,
            commands::session_store::write_session_snapshot,
            commands::session_store::recover_session,
            commands::session_store::ui_test_load_last_valid_session,
            commands::session_store::ui_test_write_session_snapshot,
            commands::session_store::ui_test_recover_session,
            commands::ui_test::is_ui_test_mode,
            commands::ui_test::ui_test_session_key,
            commands::ui_test::ui_test_persistent_session_enabled,
            commands::ui_test::ui_test_large_log_path,
            commands::ui_test::publish_ui_test_state,
            commands::ui_test::consume_ui_test_action
        ])
        .run(tauri::generate_context!())
        .expect("failed to run Crosslog desktop shell");
}
