import os
import json
import subprocess
from pathlib import Path
import tkinter as tk
from tkinter import filedialog, messagebox, ttk

BASE_DIR = Path(__file__).parent
CONFIG_FILE = BASE_DIR / "config.json"
KEY_FILE = BASE_DIR / "Opencode Zen API Key.txt"

DEFAULT_CONFIG = {
    "gateway_url": "http://localhost:8082",
    "models": {
        "DeepSeek V4 Flash": "opencode/deepseek-v4-flash-free",
        "Qwen3 Coder": "opencode/qwen3-coder-free",
        "Nemotron 3 Super": "opencode/nemotron-3-super-free"
    }
}

def load_config():
    if not CONFIG_FILE.exists():
        with open(CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(DEFAULT_CONFIG, f, indent=4)

    with open(CONFIG_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

config = load_config()

def load_keys():
    if not KEY_FILE.exists():
        return []

    with open(KEY_FILE, "r", encoding="utf-8") as f:
        return [line.strip() for line in f if line.strip()]

def save_keys(keys):
    with open(KEY_FILE, "w", encoding="utf-8") as f:
        f.write("\\n".join(keys))

def import_keys():
    file_path = filedialog.askopenfilename(
        title="Seleccionar archivo de claves",
        filetypes=[("Text files", "*.txt")]
    )

    if not file_path:
        return

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            keys = [line.strip() for line in f if line.strip()]

        save_keys(keys)

        refresh_keys()

        messagebox.showinfo("OK", f"Se importaron {len(keys)} claves")

    except Exception as e:
        messagebox.showerror("Error", str(e))

def refresh_keys():
    keys = load_keys()

    keys_box.delete(0, tk.END)

    for idx, key in enumerate(keys, 1):
        keys_box.insert(tk.END, f"{idx}. {key[:25]}...")

def launch_model(model_name):
    model = config["models"][model_name]
    keys = load_keys()

    if not keys:
        messagebox.showerror("Error", "No hay API Keys cargadas")
        return

    gateway = config["gateway_url"]

    for key in keys:
        try:
            env = os.environ.copy()

            env["ANTHROPIC_AUTH_TOKEN"] = key
            env["ANTHROPIC_BASE_URL"] = gateway
            env["CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY"] = "1"

            subprocess.Popen(
                ["claude", "--model", model],
                env=env
            )

            messagebox.showinfo(
                "Claude Launcher",
                f"Lanzando:\\n\\n{model_name}"
            )

            return

        except Exception:
            continue

    messagebox.showerror(
        "Error",
        "Todas las API Keys fallaron"
    )

root = tk.Tk()
root.title("Claude Code Launcher")
root.geometry("820x520")
root.configure(bg="#111827")

style = ttk.Style()
style.theme_use("clam")

title = tk.Label(
    root,
    text="CLAUDE CODE LAUNCHER",
    font=("Segoe UI", 22, "bold"),
    fg="white",
    bg="#111827"
)
title.pack(pady=20)

frame = tk.Frame(root, bg="#111827")
frame.pack(fill="both", expand=True, padx=20)

left = tk.Frame(frame, bg="#1F2937")
left.pack(side="left", fill="both", expand=True, padx=10, pady=10)

right = tk.Frame(frame, bg="#1F2937")
right.pack(side="right", fill="both", expand=True, padx=10, pady=10)

lbl_models = tk.Label(
    left,
    text="Modelos OpenCode",
    font=("Segoe UI", 16, "bold"),
    fg="white",
    bg="#1F2937"
)
lbl_models.pack(pady=15)

for model_name in config["models"]:
    btn = tk.Button(
        left,
        text=model_name,
        font=("Segoe UI", 12),
        bg="#2563EB",
        fg="white",
        relief="flat",
        padx=10,
        pady=10,
        command=lambda m=model_name: launch_model(m)
    )
    btn.pack(fill="x", padx=20, pady=8)

lbl_keys = tk.Label(
    right,
    text="API Keys",
    font=("Segoe UI", 16, "bold"),
    fg="white",
    bg="#1F2937"
)
lbl_keys.pack(pady=15)

keys_box = tk.Listbox(
    right,
    bg="#111827",
    fg="white",
    font=("Consolas", 10),
    relief="flat"
)
keys_box.pack(fill="both", expand=True, padx=20, pady=10)

btn_import = tk.Button(
    right,
    text="Importar archivo de claves",
    font=("Segoe UI", 11),
    bg="#10B981",
    fg="white",
    relief="flat",
    padx=10,
    pady=10,
    command=import_keys
)
btn_import.pack(fill="x", padx=20, pady=10)

refresh_keys()

root.mainloop()
