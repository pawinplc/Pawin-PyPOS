use tauri::{Manager, WebviewWindow};
use std::thread;
use std::time::Duration;

/// Called by the main window JS once React is ready.
/// Shows the main window and closes the splash screen.
#[tauri::command]
async fn close_splashscreen(app: tauri::AppHandle) {
    let splash: Option<WebviewWindow> = app.get_webview_window("splashscreen");
    let main: Option<WebviewWindow> = app.get_webview_window("main");

    if let Some(w) = splash {
        w.close().unwrap_or(());
    }
    if let Some(w) = main {
        w.show().unwrap_or(());
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            let splash_clone = app.get_webview_window("splashscreen");
            let main_clone = app.get_webview_window("main");
            
            thread::spawn(move || {
                thread::sleep(Duration::from_millis(1800));
                if let Some(w) = splash_clone {
                    let _ = w.close();
                }
                if let Some(w) = main_clone {
                    let _ = w.show();
                }
            });
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![close_splashscreen])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
