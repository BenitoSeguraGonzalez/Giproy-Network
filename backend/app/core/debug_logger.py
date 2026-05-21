from datetime import datetime

def log_debug(msg, filename="auth_debug.log"):
    try:
        with open(filename, "a") as f:
            f.write(f"{datetime.now()} - {msg}\n")
    except Exception as e:
        print(f"Error writing to debug log: {e}")
