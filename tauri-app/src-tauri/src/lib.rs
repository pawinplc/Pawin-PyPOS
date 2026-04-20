use tauri::{Manager, WebviewWindow};
use std::thread;
use std::time::Duration;

/// Called by the main window JS once React is ready.
/// Shows the main window and closes the splash screen.
#[tauri::command]
async fn close_splashscreen(app: tauri::AppHandle) {
    if let Some(splash) = app.get_webview_window("splashscreen") {
        let _ = splash.close();
    }
    if let Some(main) = app.get_webview_window("main") {
        let _ = main.show();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            let splash = app.get_webview_window("splashscreen");
            let main = app.get_webview_window("main");
            
            if let Some(w) = splash {
                println!("Splash window found");
            }
            if let Some(w) = main {
                println!("Main window found");
            }
            
            thread::spawn(move || {
                thread::sleep(Duration::from_millis(2000));
                if let Some(w) = splash {
                    let _ = w.close();
                }
                if let Some(w) = main {
                    let _ = w.show();
                }
            });
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![close_splashscreen])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
