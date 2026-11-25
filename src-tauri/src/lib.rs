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
    #[serde(default)]
    pub ctime: u64,
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
pub struct ImportNativeResult {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source_path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub target_path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    pub size: u64,
    pub ctime: u64,
    pub mtime: u64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub url: Option<String>,
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
                        let ctime = meta.created().ok()
                            .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
                            .map(|d| d.as_millis() as u64)
                            .unwrap_or(mtime);
                        let dir = p.parent().unwrap_or(Path::new("")).to_string_lossy().replace('\\', "/");
                        let path_str = p.to_string_lossy().replace('\\', "/");
                        let url = format!("http://localhost:3000/api/serve-file?path={}", simple_url_encode(&path_str));
                        files.push(FileEntry {
                            name,
                            path: path_str,
                            size: meta.len(),
                            ext,
                            mtime,
                            ctime,
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
                if file_name.starts_with('.') || file_name.eq_ignore_ascii_case("Duplicate Files") {
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
                        let ctime = meta.created().ok()
                            .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
                            .map(|d| d.as_millis() as u64)
                            .unwrap_or(mtime);
                        let dir = p.parent().unwrap_or(Path::new("")).to_string_lossy().replace('\\', "/");
                        let path_str = p.to_string_lossy().replace('\\', "/");
                        let url = format!("http://localhost:3000/api/serve-file?path={}", simple_url_encode(&path_str));
                        files.push(FileEntry {
                            name: file_name,
                            path: path_str,
                            size: meta.len(),
                            ext,
                            mtime,
                            ctime,
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

fn strip_windows_file_locks(p: &Path) {
    if !p.exists() {
        return;
    }
    // 1. Clear Read-Only attribute if set
    if let Ok(meta) = fs::metadata(p) {
        let mut perms = meta.permissions();
        if perms.readonly() {
            perms.set_readonly(false);
            let _ = fs::set_permissions(p, perms);
        }
    }
    // 2. Strip Windows Mark-of-the-Web (Zone.Identifier Alternate Data Stream)
    #[cfg(windows)]
    {
        let zone_path = format!("{}:Zone.Identifier", p.to_string_lossy());
        let _ = fs::remove_file(&zone_path);
    }
}

#[tauri::command]
fn rename_native_folder(old_path: String, new_name: String) -> Result<RenameResult, String> {
    rename_native_file(old_path, new_name)
}

#[tauri::command]
fn rename_native_file(old_path: String, new_name: String) -> Result<RenameResult, String> {
    let clean_old = old_path.replace('/', "\\");
    let p = PathBuf::from(&clean_old);
    if !p.exists() || (!p.is_file() && !p.is_dir()) {
        return Ok(RenameResult {
            success: false,
            old_path: Some(old_path),
            new_path: None,
            path: None,
            new_name: Some(new_name),
            error: Some("Original file or folder does not exist on disk".to_string()),
        });
    }

    strip_windows_file_locks(&p);

    let mut trimmed = new_name.trim().to_string();
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

    let mut target_path = parent.join(&trimmed);
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
        let mut final_target_path = target_path.clone();
        let mut final_name = trimmed.clone();
        if final_target_path.exists() {
            let path_obj = Path::new(&trimmed);
            let stem = match path_obj.file_stem() {
                Some(s) => s.to_string_lossy().to_string(),
                None => trimmed.clone(),
            };
            let ext = match path_obj.extension() {
                Some(e) => format!(".{}", e.to_string_lossy()),
                None => String::new(),
            };

            let mut counter = 2;
            let mut candidate_name = format!("{} {}{}", stem, counter, ext);
            let mut candidate_path = parent.join(&candidate_name);
            while candidate_path.exists() && clean_old.to_lowercase() != candidate_path.to_string_lossy().to_lowercase() {
                counter += 1;
                candidate_name = format!("{} {}{}", stem, counter, ext);
                candidate_path = parent.join(&candidate_name);
            }
            final_target_path = candidate_path;
            final_name = candidate_name;
        }

        if let Err(e) = fs::rename(&p, &final_target_path) {
            return Ok(RenameResult {
                success: false,
                old_path: Some(old_path),
                new_path: None,
                path: None,
                new_name: Some(final_name),
                error: Some(format!("Rename failed: {}", e)),
            });
        }
        target_path = final_target_path;
        trimmed = final_name;
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
fn move_native_file(source_path: String, target_dir_path: String) -> Result<RenameResult, String> {
    let clean_source = source_path.replace('/', "\\");
    let src = PathBuf::from(&clean_source);
    if !src.exists() || !src.is_file() {
        return Ok(RenameResult {
            success: false,
            old_path: Some(source_path),
            new_path: None,
            path: None,
            new_name: None,
            error: Some("Source file does not exist on disk".to_string()),
        });
    }

    let clean_target_dir = target_dir_path.replace('/', "\\");
    let target_dir = PathBuf::from(&clean_target_dir);
    if !target_dir.exists() {
        if let Err(e) = fs::create_dir_all(&target_dir) {
            return Ok(RenameResult {
                success: false,
                old_path: Some(source_path),
                new_path: None,
                path: None,
                new_name: None,
                error: Some(format!("Failed to create destination folder: {}", e)),
            });
        }
    }

    let file_name = match src.file_name() {
        Some(n) => n.to_string_lossy().to_string(),
        None => return Ok(RenameResult {
            success: false,
            old_path: Some(source_path),
            new_path: None,
            path: None,
            new_name: None,
            error: Some("Invalid filename".to_string()),
        }),
    };

    let path_obj = Path::new(&file_name);
    let stem = match path_obj.file_stem() {
        Some(s) => s.to_string_lossy().to_string(),
        None => file_name.clone(),
    };
    let ext = match path_obj.extension() {
        Some(e) => format!(".{}", e.to_string_lossy()),
        None => String::new(),
    };

    let mut dest_path = target_dir.join(&file_name);
    let mut dest_name = file_name.clone();
    let mut counter = 1;
    while dest_path.exists() {
        dest_name = format!("{}_{}{}", stem, counter, ext);
        dest_path = target_dir.join(&dest_name);
        counter += 1;
    }

    if let Err(e) = fs::rename(&src, &dest_path) {
        return Ok(RenameResult {
            success: false,
            old_path: Some(source_path),
            new_path: None,
            path: None,
            new_name: Some(dest_name),
            error: Some(format!("Move failed: {}", e)),
        });
    }

    let new_path_str = dest_path.to_string_lossy().replace('\\', "/");
    Ok(RenameResult {
        success: true,
        old_path: Some(source_path),
        new_path: Some(new_path_str.clone()),
        path: Some(new_path_str),
        new_name: Some(dest_name),
        error: None,
    })
}

#[tauri::command]
fn import_native_file(
    source_path: String,
    target_dir: String,
    target_name: String,
    move_file: Option<bool>,
) -> Result<ImportNativeResult, String> {
    let clean_src = source_path.replace('/', "\\");
    let src = PathBuf::from(&clean_src);
    if !src.exists() || !src.is_file() {
        return Ok(ImportNativeResult {
            success: false,
            source_path: Some(source_path),
            target_path: None,
            path: None,
            name: None,
            size: 0,
            ctime: 0,
            mtime: 0,
            url: None,
            error: Some("Source file does not exist on disk".to_string()),
        });
    }

    let clean_target_dir = target_dir.replace('/', "\\");
    let target_dir_path = PathBuf::from(&clean_target_dir);
    if !target_dir_path.exists() {
        if let Err(e) = fs::create_dir_all(&target_dir_path) {
            return Ok(ImportNativeResult {
                success: false,
                source_path: Some(source_path),
                target_path: None,
                path: None,
                name: None,
                size: 0,
                ctime: 0,
                mtime: 0,
                url: None,
                error: Some(format!("Failed to create destination folder: {}", e)),
            });
        }
    }

    let final_name = if target_name.trim().is_empty() {
        src.file_name().unwrap_or_default().to_string_lossy().to_string()
    } else {
        target_name.trim().to_string()
    };

    let path_obj = Path::new(&final_name);
    let stem = path_obj.file_stem().unwrap_or_default().to_string_lossy().to_string();
    let ext = match path_obj.extension() {
        Some(e) => format!(".{}", e.to_string_lossy()),
        None => String::new(),
    };

    let mut dest_path = target_dir_path.join(&final_name);
    let mut actual_name = final_name.clone();
    let mut counter = 2;
    while dest_path.exists() {
        actual_name = format!("{} {}{}", stem, counter, ext);
        dest_path = target_dir_path.join(&actual_name);
        counter += 1;
    }

    let should_move = move_file.unwrap_or(true);
    if should_move {
        if let Err(_rename_err) = fs::rename(&src, &dest_path) {
            if let Err(copy_err) = fs::copy(&src, &dest_path) {
                return Ok(ImportNativeResult {
                    success: false,
                    source_path: Some(source_path),
                    target_path: None,
                    path: None,
                    name: None,
                    size: 0,
                    ctime: 0,
                    mtime: 0,
                    url: None,
                    error: Some(format!("Failed to move file to destination: {}", copy_err)),
                });
            }
            let _ = fs::remove_file(&src);
        }
    } else {
        if let Err(copy_err) = fs::copy(&src, &dest_path) {
            return Ok(ImportNativeResult {
                success: false,
                source_path: Some(source_path),
                target_path: None,
                path: None,
                name: None,
                size: 0,
                ctime: 0,
                mtime: 0,
                url: None,
                error: Some(format!("Failed to copy file to destination: {}", copy_err)),
            });
        }
    }

    strip_windows_file_locks(&dest_path);

    let meta = fs::metadata(&dest_path).ok();
    let size = meta.as_ref().map(|m| m.len()).unwrap_or(0);
    let mtime = meta.as_ref()
        .and_then(|m| m.modified().ok())
        .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0);
    let ctime = meta.as_ref()
        .and_then(|m| m.created().ok())
        .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
        .map(|d| d.as_millis() as u64)
        .unwrap_or(mtime);

    let target_path_str = dest_path.to_string_lossy().replace('\\', "/");
    let url = format!("http://localhost:3000/api/serve-file?path={}", simple_url_encode(&target_path_str));

    Ok(ImportNativeResult {
        success: true,
        source_path: Some(source_path),
        target_path: Some(target_path_str.clone()),
        path: Some(target_path_str),
        name: Some(actual_name),
        size,
        ctime,
        mtime,
        url: Some(url),
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

fn hash_hardware_string(input: &str) -> String {
    let mut h1: u64 = 0xcbf29ce484222325;
    let mut h2: u64 = 0x100000001b3;
    for b in input.bytes() {
        h1 = (h1 ^ (b as u64)).wrapping_mul(0x100000001b3);
        h2 = (h2 ^ (b as u64)).wrapping_mul(0xcbf29ce484222325);
    }
    let hex1 = format!("{:08X}", (h1 >> 32) ^ (h1 & 0xFFFFFFFF));
    let hex2 = format!("{:08X}", (h2 >> 32) ^ (h2 & 0xFFFFFFFF));
    format!("DM-HW-{}-{}-{}-{}", &hex1[0..4], &hex1[4..8], &hex2[0..4], &hex2[4..8])
}

#[tauri::command]
fn get_machine_hardware_id() -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        let mut raw_guid = String::new();
        if let Ok(output) = std::process::Command::new("reg")
            .args(&["query", r"HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Cryptography", "/v", "MachineGuid"])
            .output()
        {
            let text = String::from_utf8_lossy(&output.stdout);
            for line in text.lines() {
                if line.contains("MachineGuid") {
                    let parts: Vec<&str> = line.split_whitespace().collect();
                    if let Some(val) = parts.last() {
                        raw_guid = val.to_string();
                    }
                }
            }
        }

        let mut raw_uuid = String::new();
        if let Ok(output) = std::process::Command::new("powershell")
            .args(&["-NoProfile", "-Command", "(Get-CimInstance Win32_ComputerSystemProduct).UUID"])
            .output()
        {
            raw_uuid = String::from_utf8_lossy(&output.stdout).trim().to_string();
        }

        let combined = format!("{}:{}", raw_guid, raw_uuid);
        if combined.trim() == ":" {
            let name = std::env::var("COMPUTERNAME").unwrap_or_else(|_| "DEFAULT".to_string());
            let user = std::env::var("USERNAME").unwrap_or_else(|_| "USER".to_string());
            return Ok(hash_hardware_string(&format!("{}:{}", name, user)));
        }

        Ok(hash_hardware_string(&combined))
    }
    #[cfg(not(target_os = "windows"))]
    {
        let host = std::env::var("HOSTNAME").unwrap_or_else(|_| "DEFAULT-HOST".to_string());
        Ok(hash_hardware_string(&host))
    }
}

#[tauri::command]
fn read_binary_file(path: String) -> Result<Vec<u8>, String> {
    let clean_path = path.replace('/', "\\");
    let p = PathBuf::from(&clean_path);
    if !p.exists() || !p.is_file() {
        return Err(format!("File '{}' does not exist on disk", path));
    }
    match fs::read(&p) {
        Ok(bytes) => Ok(bytes),
        Err(e) => Err(format!("Failed to read file bytes: {}", e)),
    }
}

#[tauri::command]
fn write_binary_file(path: String, bytes: Vec<u8>) -> Result<bool, String> {
    let clean_path = path.replace('/', "\\");
    let p = PathBuf::from(&clean_path);
    if let Some(parent) = p.parent() {
        if !parent.exists() {
            let _ = fs::create_dir_all(parent);
        }
    }
    strip_windows_file_locks(&p);
    match fs::write(&p, bytes) {
        Ok(_) => {
            strip_windows_file_locks(&p);
            Ok(true)
        },
        Err(e) => Err(format!("Failed to write file bytes: {}", e)),
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
      rename_native_folder,
      move_native_file,
      import_native_file,
      open_in_explorer,
      read_binary_file,
      write_binary_file,
      get_machine_hardware_id
    ])
    .run(tauri::generate_context!())
    .expect("error while building tauri application");
}
