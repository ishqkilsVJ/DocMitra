// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
  std::panic::set_hook(Box::new(|info| {
    let msg = format!("PANIC: {}\n", info);
    let _ = std::fs::write("C:\\Users\\USER\\AppData\\Local\\DocMitra\\panic.log", msg);
  }));
  // Prevent port 9222 collisions from system-wide WebView2 environment variable unless explicitly debugging
  let has_debug_arg = std::env::args().any(|arg| arg.contains("--remote-debugging-port"));
  if !has_debug_arg {
    unsafe {
      std::env::remove_var("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS");
    }
  }
  app_lib::run();
}
