
import psutil
import os
import signal

def kill_process_on_port(port):
    for conn in psutil.net_connections(kind='tcp'):
        if conn.laddr.port == port:
            try:
                p = psutil.Process(conn.pid)
                print(f"Terminating process {p.pid} ({p.name()}) on port {port}")
                p.terminate()
                return True
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                print(f"Failed to terminate process {conn.pid}")
    return False

if __name__ == "__main__":
    if kill_process_on_port(3000):
        print("Process killed. NSSM should restart it shortly.")
    else:
        print("No process found on port 3000.")
