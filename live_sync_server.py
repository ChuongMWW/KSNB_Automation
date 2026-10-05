import http.server
import socketserver
import json
import os
import sys
import shutil
from datetime import datetime

PORT = 8765
HOST = "127.0.0.1"

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_HTML_PATH = os.path.join(BASE_DIR, "Tho_DMX", "Quy_trinh_bao_hanh_uy_quyen_kho_ttbh.html")
USER_PROFILE = os.environ.get("USERPROFILE", r"C:\Users\PC")
DOWNLOADS_PATH = os.path.join(USER_PROFILE, "Downloads", "quy_trinh_bao_hanh_uy_quyen_kho_ttbh_format_moi.html")
BACKUP_DIR = os.path.join(BASE_DIR, "_backups")

os.makedirs(BACKUP_DIR, exist_ok=True)

class SyncHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        if self.path == "/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            resp = {
                "status": "ok",
                "connected": True,
                "server_time": datetime.now().isoformat(),
                "repo_path": REPO_HTML_PATH,
                "downloads_path": DOWNLOADS_PATH
            }
            self.wfile.write(json.dumps(resp, ensure_ascii=False).encode("utf-8"))
            return

        if self.path == "/" or self.path.startswith("/?"):
            if os.path.exists(REPO_HTML_PATH):
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.end_headers()
                with open(REPO_HTML_PATH, "rb") as f:
                    self.wfile.write(f.read())
                return

        super().do_GET()

    def do_POST(self):
        if self.path == "/api/save":
            content_length = int(self.headers.get("Content-Length", 0))
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data.decode("utf-8"))
                html_content = data.get("html", "")
                if not html_content or len(html_content) < 500:
                    raise ValueError("Nội dung HTML quá ngắn hoặc rỗng!")

                # Ensure DOCTYPE
                if not html_content.strip().startswith("<!DOCTYPE html>"):
                    html_content = "<!DOCTYPE html>\n" + html_content

                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

                # Determine target file paths
                target_repo_path = data.get("targetPath", REPO_HTML_PATH)
                target_dl_path = data.get("downloadsPath", DOWNLOADS_PATH)

                # 1. Create a safety backup of existing file
                if os.path.exists(target_repo_path):
                    base_name = os.path.splitext(os.path.basename(target_repo_path))[0]
                    backup_filename = f"backup_{timestamp}_{base_name}.bak"
                    backup_file_path = os.path.join(BACKUP_DIR, backup_filename)
                    shutil.copy2(target_repo_path, backup_file_path)

                # 2. Write to main repo HTML
                os.makedirs(os.path.dirname(target_repo_path), exist_ok=True)
                with open(target_repo_path, "w", encoding="utf-8") as f:
                    f.write(html_content)

                # 3. Write to Downloads backup
                try:
                    if target_dl_path:
                        os.makedirs(os.path.dirname(target_dl_path), exist_ok=True)
                        with open(target_dl_path, "w", encoding="utf-8") as f:
                            f.write(html_content)
                except Exception as e:
                    print(f"Warning: Could not save to downloads: {e}")

                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                resp = {
                    "success": True,
                    "message": "Đã tự động cập nhật vào file code thành công!",
                    "timestamp": timestamp,
                    "saved_to": [target_repo_path, target_dl_path]
                }
                self.wfile.write(json.dumps(resp, ensure_ascii=False).encode("utf-8"))
                print(f"[{timestamp}] Successfully saved changes to {os.path.basename(target_repo_path)}!")
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                resp = {"success": False, "error": str(e)}
                self.wfile.write(json.dumps(resp, ensure_ascii=False).encode("utf-8"))
                print(f"Error saving: {e}")
            return

        self.send_response(404)
        self.end_headers()

def run_server():
    os.chdir(BASE_DIR)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer((HOST, PORT), SyncHandler) as httpd:
        print("=======================================================")
        print("KSNB LIVE AUTO-SYNC SERVER IS RUNNING")
        print(f"Address: http://{HOST}:{PORT}")
        print("Auto-save is ACTIVE for both repo and downloads files.")
        print("=======================================================")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("Server stopped.")
            httpd.server_close()

if __name__ == "__main__":
    run_server()
