use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::time::UNIX_EPOCH;

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub size: u64,
    pub ext: String,
    pub mtime: u64,
    pub dir: String,
    pub url: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SubfolderEntry {
    pub name: String,
    pub path: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct DirectoryResult {
    pub success: bool,
    pub path: String,
    pub name: String,
    pub files: Vec<FileEntry>,
    pub subfolders: Vec<SubfolderEntry>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct RenameResult {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub old_path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub new_path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub new_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct FilesResult {
    pub success: bool,
    pub files: Vec<FileEntry>,
    pub cancelled: bool,
}

fn simple_url_encode(s: &str) -> String {
    let mut encoded = String::with_capacity(s.len() * 3);
    for b in s.as_bytes() {
        match *b {
            b'a'..=b'z' | b'A'..=b'Z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' | b'/' => {
                encoded.push(*b as char);
            }
            _ => {
                encoded.push_str(&format!("%{:02X}", b));
            }
        }
    }
    encoded
}

#[tauri::command]
fn pick_native_folder() -> Result<Option<String>, String> {
    let folder = rfd::FileDialog::new()
        .set_title("Select Folder - DocMitra")
        .pick_folder();
    Ok(folder.map(|p| p.to_string_lossy().replace('\\', "/")))
}

#[tauri::command]
fn pick_native_files() -> Result<FilesResult, String> {
    let selected = rfd::FileDialog::new()
        .set_title("Select Documents - DocMitra")
        .add_filter(
            "Documents & Images",
            &["pdf", "jpg", "jpeg", "png", "webp", "docx", "xlsx", "csv", "txt"],
        )
        .add_filter("All Files", &["*"])
        .pick_files();

    match selected {
        Some(paths) if !paths.is_empty() => {
            let mut files = Vec::new();
            for p in paths {
                if let Ok(meta) = fs::metadata(&p) {
                    if meta.is_file() {
                        let name = p.file_name().unwrap_or_default().to_string_lossy().to_string();
                        let ext = p.extension().map(|e| format!(".{}", e.to_string_lossy().to_lowercase())).unwrap_or_default();
                        let mtime = meta.modified().ok()
                            .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
                            .map(|d| d.as_millis() as u64)
                            .unwrap_or(0);
                        let dir = p.parent().unwrap_or(Path::new("")).to_string_lossy().replace('\\', "/");
                        let path_str = p.to_string_lossy().replace('\\', "/");
                        let url = format!("http://localhost:3000/api/serve-file?path={}", simple_url_encode(&path_str));
                        files.push(FileEntry {
                            name,
                            path: path_str,
                            size: meta.len(),
                            ext,
                            mtime,
                            dir,
                            url,
                        });
                    }
                }
            }
            Ok(FilesResult {
                success: true,
                files,
                cancelled: false,
            })
        }
        _ => Ok(FilesResult {
            success: false,
            files: vec![],
            cancelled: true,
        }),
    }
}

#[tauri::command]
fn list_native_directory(path: String) -> Result<DirectoryResult, String> {
    let clean_path = path.replace('/', "\\");
    let dir_path = PathBuf::from(&clean_path);
    if !dir_path.exists() || !dir_path.is_dir() {
        return Ok(DirectoryResult {
            success: false,
            path: path.clone(),
            name: String::new(),
            files: vec![],
            subfolders: vec![],
            error: Some(format!("Directory '{}' does not exist", path)),
        });
    }

    let dir_name = dir_path
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| path.clone());

    let mut subfolders = Vec::new();
    let mut files = Vec::new();

    if let Ok(entries) = fs::read_dir(&dir_path) {
        for entry_res in entries {
            if let Ok(entry) = entry_res {
                let p = entry.path();
                let file_name = entry.file_name().to_string_lossy().to_string();
                if file_name.starts_with('.') {
                    continue;
                }
                if let Ok(meta) = entry.metadata() {
                    if meta.is_dir() {
                        subfolders.push(SubfolderEntry {
                            name: file_name,
                            path: p.to_string_lossy().replace('\\', "/"),
                        });
                    } else if meta.is_file() {
                        let ext = p.extension().map(|e| format!(".{}", e.to_string_lossy().to_lowercase())).unwrap_or_default();
                        let mtime = meta.modified().ok()
                            .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
                            .map(|d| d.as_millis() as u64)
                            .unwrap_or(0);
                        let dir = p.parent().unwrap_or(Path::new("")).to_string_lossy().replace('\\', "/");
                        let path_str = p.to_string_lossy().replace('\\', "/");
                        let url = format!("http://localhost:3000/api/serve-file?path={}", simple_url_encode(&path_str));
                        files.push(FileEntry {
                            name: file_name,
                            path: path_str,
                            size: meta.len(),
                            ext,
                            mtime,
                            dir,
                            url,
                        });
                    }
                }
            }
        }
    }

    subfolders.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    files.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));

    Ok(DirectoryResult {
        success: true,
        path: dir_path.to_string_lossy().replace('\\', "/"),
        name: dir_name,
        files,
        subfolders,
        error: None,
    })
}

#[tauri::command]
fn rename_native_file(old_path: String, new_name: String) -> Result<RenameResult, String> {
    let clean_old = old_path.replace('/', "\\");
    let p = PathBuf::from(&clean_old);
    if !p.exists() || !p.is_file() {
        return Ok(RenameResult {
            success: false,
            old_path: Some(old_path),
            new_path: None,
            path: None,
            new_name: Some(new_name),
            error: Some("Original file does not exist on disk".to_string()),
        });
    }

    let trimmed = new_name.trim().to_string();
    if trimmed.is_empty() || trimmed.contains(&['<', '>', ':', '"', '/', '\\', '|', '?', '*']) {
        return Ok(RenameResult {
            success: false,
            old_path: Some(old_path),
            new_path: None,
            path: None,
            new_name: Some(trimmed),
            error: Some("Filename contains invalid Windows characters".to_string()),
        });
    }

    let parent = match p.parent() {
        Some(par) => par,
        None => return Ok(RenameResult {
            success: false,
            old_path: Some(old_path),
            new_path: None,
            path: None,
            new_name: Some(trimmed),
            error: Some("Invalid parent directory".to_string()),
        }),
    };

    let target_path = parent.join(&trimmed);
    if clean_old.to_lowercase() == target_path.to_string_lossy().to_lowercase() {
        let temp_name = format!("{}.docmitra_tmp_{}", trimmed, std::time::SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_nanos());
        let temp_path = parent.join(&temp_name);
        if let Err(e) = fs::rename(&p, &temp_path) {
            return Ok(RenameResult {
                success: false,
                old_path: Some(old_path),
                new_path: None,
                path: None,
                new_name: Some(trimmed),
                error: Some(format!("Step 1 rename failed: {}", e)),
            });
        }
        if let Err(e) = fs::rename(&temp_path, &target_path) {
            let _ = fs::rename(&temp_path, &p);
            return Ok(RenameResult {
                success: false,
                old_path: Some(old_path),
                new_path: None,
                path: None,
                new_name: Some(trimmed),
                error: Some(format!("Step 2 rename failed: {}", e)),
            });
        }
    } else {
        if target_path.exists() {
            return Ok(RenameResult {
                success: false,
                old_path: Some(old_path),
                new_path: None,
                path: None,
                new_name: Some(trimmed.clone()),
                error: Some(format!("A file named '{}' already exists in this folder", trimmed)),
            });
        }
        if let Err(e) = fs::rename(&p, &target_path) {
            return Ok(RenameResult {
                success: false,
                old_path: Some(old_path),
                new_path: None,
                path: None,
                new_name: Some(trimmed),
                error: Some(format!("Rename failed: {}", e)),
            });
        }
    }

    let new_path_str = target_path.to_string_lossy().replace('\\', "/");
    Ok(RenameResult {
        success: true,
        old_path: Some(old_path),
        new_path: Some(new_path_str.clone()),
        path: Some(new_path_str),
        new_name: Some(trimmed),
        error: None,
    })
}

#[tauri::command]
fn open_in_explorer(path: String) -> Result<bool, String> {
    #[cfg(target_os = "windows")]
    {
        let win_path = path.replace('/', "\\");
        let _ = std::process::Command::new("explorer")
            .arg(win_path)
            .spawn();
        Ok(true)
    }
    #[cfg(not(target_os = "windows"))]
    {
        let _ = path;
        Ok(false)
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      pick_native_folder,
      pick_native_files,
      list_native_directory,
      rename_native_file,
      open_in_explorer
    ])
    .run(tauri::generate_context!())
    .expect("error while building tauri application");
}
