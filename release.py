#!/usr/bin/env python3
"""Stamp a new version so installed apps pick up the change.

Usage: python3 release.py "One line on what's new, shown to users in the update card."
Then commit and push. Run it for every change, however small.
"""
import hashlib, re, sys, pathlib
root = pathlib.Path(__file__).parent
news = (sys.argv[1] if len(sys.argv) > 1 else "Small fixes and improvements.").replace('"', "'")
files = ["index.html", "css/app.css", "js/i18n-data.js", "js/i18n.js", "js/content.js", "js/audio.js", "js/lessons.js", "js/view.js", "js/map.js", "js/glossary.js", "js/stats.js", "js/app.js", "js/setup.js", "js/onboard.js", "manifest.webmanifest"]
shell = (root / "js/shell.js").read_text()
shell_body = re.sub(r'var KLAAR_VERSION = "[^"]*", KLAAR_NEWS = "[^"]*";', "", shell)
h = hashlib.sha1()
for f in files: h.update((root / f).read_bytes())
h.update(shell_body.encode()); h.update(news.encode())
ver = h.hexdigest()[:10]
shell = re.sub(r'var KLAAR_VERSION = "[^"]*", KLAAR_NEWS = "[^"]*";', f'var KLAAR_VERSION = "{ver}", KLAAR_NEWS = "{news}";', shell, count=1)
(root / "js/shell.js").write_text(shell)
sw = (root / "sw.js").read_text()
sw = re.sub(r'const VERSION = "[^"]*";', f'const VERSION = "{ver}";', sw, count=1)
(root / "sw.js").write_text(sw)
print("version", ver)
