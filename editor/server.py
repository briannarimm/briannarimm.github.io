#!/usr/bin/env python3
"""Collection Editor: a small local app that creates and edits items in the
Papers & Projects collection and publishes them to GitHub in one commit.

Run:  python3 server.py --open
It uses only the Python standard library. It signs in to GitHub with the
token of the GitHub CLI (`gh auth token`), so no login form is necessary.
The server listens on 127.0.0.1 only.
"""

import argparse
import base64
import json
import mimetypes
import os
import re
import secrets
import shutil
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO_ROOT = HERE.parent
STATIC = HERE / "static"
PORT = 8790
BRANCH = "main"
ITEMS_DIR = "_items"
ASSETS_DIR = "assets/items"
SIGNATURE = "collection-editor"
SESSION = secrets.token_urlsafe(24)
API = "https://api.github.com"

SLUG_RE = re.compile(r"^[a-z0-9][a-z0-9-]{0,80}$")
EXTRA_PATHS = ["/opt/homebrew/bin", "/usr/local/bin", "/usr/bin", "/bin"]


# ---------------------------------------------------------------- helpers

def find_tool(name):
    found = shutil.which(name)
    if found:
        return found
    for d in EXTRA_PATHS:
        p = Path(d) / name
        if p.exists():
            return str(p)
    return None


def repo_slug():
    """Return 'owner/repo' from the git remote, with a safe default."""
    git = find_tool("git")
    if git:
        try:
            url = subprocess.run([git, "-C", str(REPO_ROOT), "remote", "get-url", "origin"],
                                 capture_output=True, text=True, timeout=10).stdout.strip()
            m = re.search(r"github\.com[:/]([^/]+)/([^/]+?)(?:\.git)?$", url)
            if m:
                return f"{m.group(1)}/{m.group(2)}"
        except Exception:
            pass
    return "briannarimm/briannarimm.github.io"


REPO = repo_slug()
_token = None
_token_lock = threading.Lock()


class GitHubError(Exception):
    def __init__(self, status, message):
        super().__init__(message)
        self.status = status


def token():
    global _token
    with _token_lock:
        if _token:
            return _token
        gh = find_tool("gh")
        if not gh:
            raise GitHubError(401, "The GitHub CLI (gh) is not installed. Install it with: brew install gh")
        r = subprocess.run([gh, "auth", "token"], capture_output=True, text=True, timeout=15)
        t = r.stdout.strip()
        if r.returncode != 0 or not t:
            raise GitHubError(401, "The GitHub CLI is not signed in. Run this in Terminal: gh auth login")
        _token = t
        return _token


def gh_request(method, path, body=None, accept="application/vnd.github+json", raw=False):
    url = path if path.startswith("http") else API + path
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", f"Bearer {token()}")
    req.add_header("Accept", accept)
    req.add_header("X-GitHub-Api-Version", "2022-11-28")
    req.add_header("User-Agent", SIGNATURE)
    if data is not None:
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            payload = resp.read()
            if raw:
                return payload, resp.headers.get("Content-Type", "application/octet-stream")
            return json.loads(payload) if payload else {}
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", "replace")
        try:
            detail = json.loads(detail).get("message", detail)
        except Exception:
            pass
        raise GitHubError(e.code, f"GitHub returned {e.code}: {detail}")
    except urllib.error.URLError as e:
        raise GitHubError(503, f"Cannot reach GitHub: {e.reason}")


def safe_repo_path(p):
    """Allow writes only to item files and item assets."""
    p = p.strip().lstrip("/")
    if ".." in p.split("/") or "\\" in p:
        raise ValueError(f"Unsafe path: {p}")
    if not (re.fullmatch(rf"{ITEMS_DIR}/[a-z0-9][a-z0-9-]*\.md", p) or p.startswith(ASSETS_DIR + "/")):
        raise ValueError(f"The editor can only write item files and item assets, not: {p}")
    return p


def pull_local_clone():
    """Keep the local clone current after a publish. Errors are ignored."""
    git = find_tool("git")
    if git:
        subprocess.run([git, "-C", str(REPO_ROOT), "pull", "--ff-only", "--quiet"],
                       capture_output=True, timeout=60)


# ---------------------------------------------------------------- publish

def publish(payload):
    slug = payload.get("slug", "")
    if not SLUG_RE.match(slug):
        raise ValueError("The slug must use lowercase letters, numbers, and hyphens.")
    markdown = payload.get("markdown", "")
    if not markdown.startswith("---"):
        raise ValueError("The item file must start with front matter.")

    files = [{"path": f"{ITEMS_DIR}/{slug}.md", "bytes": markdown.encode("utf-8")}]
    for f in payload.get("files", []):
        path = safe_repo_path(f["path"])
        if not path.startswith(f"{ASSETS_DIR}/{slug}/"):
            raise ValueError(f"Files must go in {ASSETS_DIR}/{slug}/")
        files.append({"path": path, "bytes": base64.b64decode(f["content_b64"])})
    deletions = []
    for p in payload.get("delete", []):
        p = safe_repo_path(p)
        if p.startswith(f"{ASSETS_DIR}/{slug}/"):
            deletions.append(p)

    ref = gh_request("GET", f"/repos/{REPO}/git/ref/heads/{BRANCH}")
    head_sha = ref["object"]["sha"]
    head_commit = gh_request("GET", f"/repos/{REPO}/git/commits/{head_sha}")

    if payload.get("is_new"):
        try:
            gh_request("GET", f"/repos/{REPO}/contents/{ITEMS_DIR}/{slug}.md?ref={BRANCH}")
            raise ValueError(f"An item with the slug '{slug}' already exists. Choose another slug.")
        except GitHubError as e:
            if e.status != 404:
                raise

    tree = []
    for f in files:
        blob = gh_request("POST", f"/repos/{REPO}/git/blobs",
                          {"content": base64.b64encode(f["bytes"]).decode(), "encoding": "base64"})
        tree.append({"path": f["path"], "mode": "100644", "type": "blob", "sha": blob["sha"]})
    written = {t["path"] for t in tree}
    for p in deletions:
        if p not in written:
            tree.append({"path": p, "mode": "100644", "type": "blob", "sha": None})

    new_tree = gh_request("POST", f"/repos/{REPO}/git/trees",
                          {"base_tree": head_commit["tree"]["sha"], "tree": tree})
    verb = "Add" if payload.get("is_new") else "Update"
    message = payload.get("message") or f"{verb} item: {payload.get('title') or slug}"
    commit = gh_request("POST", f"/repos/{REPO}/git/commits",
                        {"message": message, "tree": new_tree["sha"], "parents": [head_sha]})
    gh_request("PATCH", f"/repos/{REPO}/git/refs/heads/{BRANCH}", {"sha": commit["sha"], "force": False})

    threading.Thread(target=pull_local_clone, daemon=True).start()
    return {
        "commit": commit["sha"],
        "commit_url": f"https://github.com/{REPO}/commit/{commit['sha']}",
        "files": len(tree),
    }


def site_url():
    cname = REPO_ROOT / "CNAME"
    if cname.exists():
        host = cname.read_text().strip()
        if host:
            return f"https://{host}"
    owner = REPO.split("/")[0]
    return f"https://{owner}.github.io"


# ---------------------------------------------------------------- server

class Handler(BaseHTTPRequestHandler):
    server_version = "CollectionEditor/1.0"

    def log_message(self, fmt, *args):
        sys.stderr.write("[editor] " + (fmt % args) + "\n")

    # Only accept requests addressed to this local server.
    def host_ok(self):
        host = (self.headers.get("Host") or "").split(":")[0]
        return host in ("127.0.0.1", "localhost")

    def api_ok(self):
        if not self.host_ok():
            return False
        origin = self.headers.get("Origin")
        if origin and urllib.parse.urlparse(origin).hostname not in ("127.0.0.1", "localhost"):
            return False
        return secrets.compare_digest(self.headers.get("X-Session", ""), SESSION)

    def send_json(self, obj, status=200):
        data = json.dumps(obj).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def send_bytes(self, data, ctype, status=200, cache="no-store"):
        self.send_response(status)
        self.send_header("Content-Type", ctype)
        self.send_header("Cache-Control", cache)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def send_file(self, path):
        if not path.is_file():
            return self.send_bytes(b"Not found", "text/plain", 404)
        ctype = mimetypes.guess_type(str(path))[0] or "application/octet-stream"
        self.send_bytes(path.read_bytes(), ctype)

    def do_GET(self):
        if not self.host_ok():
            return self.send_bytes(b"Forbidden", "text/plain", 403)
        u = urllib.parse.urlparse(self.path)
        q = urllib.parse.parse_qs(u.query)
        p = u.path

        if p in ("/", "/index.html"):
            html = (STATIC / "index.html").read_text("utf-8")
            config = json.dumps({"session": SESSION, "repo": REPO, "branch": BRANCH, "site": site_url()})
            html = html.replace("/*__CONFIG__*/", f"window.EDITOR_CONFIG = {config};")
            return self.send_bytes(html.encode(), "text/html; charset=utf-8")
        if p == "/ping":
            return self.send_json({"app": SIGNATURE})
        if p.startswith("/static/"):
            target = (STATIC / p[len("/static/"):]).resolve()
            if STATIC not in target.parents:
                return self.send_bytes(b"Forbidden", "text/plain", 403)
            return self.send_file(target)
        if p.startswith("/site/"):
            # Site files for the live preview (style.css, script.js, images).
            rel = urllib.parse.unquote(p[len("/site/"):])
            target = (REPO_ROOT / rel).resolve()
            if (REPO_ROOT not in target.parents or HERE in target.parents
                    or any(part.startswith(".") for part in target.relative_to(REPO_ROOT).parts)):
                return self.send_bytes(b"Forbidden", "text/plain", 403)
            return self.send_file(target)

        if not p.startswith("/api/"):
            return self.send_bytes(b"Not found", "text/plain", 404)
        if p == "/api/raw":
            # Image previews are <img> requests, so they cannot carry the session
            # header. They carry it in the query string instead.
            if not secrets.compare_digest((q.get("s") or [""])[0], SESSION):
                return self.send_bytes(b"Forbidden", "text/plain", 403)
        elif not self.api_ok():
            return self.send_json({"error": "Forbidden"}, 403)

        try:
            if p == "/api/me":
                me = gh_request("GET", "/user")
                return self.send_json({"login": me["login"], "name": me.get("name"),
                                       "avatar": me.get("avatar_url"), "repo": REPO})
            if p == "/api/items":
                try:
                    listing = gh_request("GET", f"/repos/{REPO}/contents/{ITEMS_DIR}?ref={BRANCH}")
                except GitHubError as e:
                    if e.status == 404:
                        return self.send_json({"items": []})
                    raise
                items = [{"slug": f["name"][:-3], "path": f["path"]}
                         for f in listing if f["type"] == "file" and f["name"].endswith(".md")]
                return self.send_json({"items": sorted(items, key=lambda i: i["slug"])})
            if p == "/api/item":
                slug = (q.get("slug") or [""])[0]
                if not SLUG_RE.match(slug):
                    return self.send_json({"error": "Bad slug"}, 400)
                data, _ = gh_request("GET", f"/repos/{REPO}/contents/{ITEMS_DIR}/{slug}.md?ref={BRANCH}",
                                     accept="application/vnd.github.raw", raw=True)
                return self.send_json({"slug": slug, "markdown": data.decode("utf-8")})
            if p == "/api/raw":
                path = safe_repo_path((q.get("path") or [""])[0])
                data, ctype = gh_request("GET", f"/repos/{REPO}/contents/{urllib.parse.quote(path)}?ref={BRANCH}",
                                         accept="application/vnd.github.raw", raw=True)
                guessed = mimetypes.guess_type(path)[0]
                return self.send_bytes(data, guessed or ctype, cache="max-age=300")
            if p == "/api/pages":
                b = gh_request("GET", f"/repos/{REPO}/pages/builds/latest")
                return self.send_json({"status": b.get("status"), "commit": b.get("commit"),
                                       "error": (b.get("error") or {}).get("message")})
            return self.send_json({"error": "Not found"}, 404)
        except GitHubError as e:
            return self.send_json({"error": str(e)}, e.status if 400 <= e.status < 600 else 502)
        except ValueError as e:
            return self.send_json({"error": str(e)}, 400)

    def do_POST(self):
        if not self.api_ok():
            return self.send_json({"error": "Forbidden"}, 403)
        length = int(self.headers.get("Content-Length") or 0)
        try:
            body = json.loads(self.rfile.read(length) or b"{}")
        except json.JSONDecodeError:
            return self.send_json({"error": "Bad JSON"}, 400)
        p = urllib.parse.urlparse(self.path).path
        try:
            if p == "/api/publish":
                return self.send_json(publish(body))
            if p == "/api/quit":
                self.send_json({"ok": True})
                threading.Thread(target=self.server.shutdown, daemon=True).start()
                return
            return self.send_json({"error": "Not found"}, 404)
        except GitHubError as e:
            return self.send_json({"error": str(e)}, e.status if 400 <= e.status < 600 else 502)
        except (ValueError, KeyError) as e:
            return self.send_json({"error": str(e)}, 400)


def already_running():
    try:
        with urllib.request.urlopen(f"http://127.0.0.1:{PORT}/ping", timeout=2) as r:
            return json.loads(r.read()).get("app") == SIGNATURE
    except Exception:
        return False


def open_window(url):
    """Open the editor in an app-style window when Chrome or Edge is present."""
    for app in ("Google Chrome", "Microsoft Edge", "Brave Browser"):
        if Path(f"/Applications/{app}.app").exists():
            subprocess.Popen(["open", "-na", app, "--args", f"--app={url}", "--window-size=1500,950"])
            return
    webbrowser.open(url)


def main():
    ap = argparse.ArgumentParser(description="Collection Editor")
    ap.add_argument("--open", action="store_true", help="open the editor window")
    args = ap.parse_args()
    url = f"http://127.0.0.1:{PORT}/"

    if already_running():
        if args.open:
            open_window(url)
        print(f"Collection Editor is already running at {url}")
        return

    server = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    print(f"Collection Editor: {url}  (repository {REPO}, branch {BRANCH})")
    print("Press Control+C to stop.")
    if args.open:
        threading.Timer(0.6, open_window, [url]).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
