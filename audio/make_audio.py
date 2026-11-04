#!/usr/bin/env python3
"""Record natural Dutch audio for every listening question (anything with an `audio` text in js/content.js).

Uses Piper, an open-source neural voice that runs offline. Voice: nl_NL ronnie (CC0 dataset), tuned for clear
speech (less noise) and 22% slower for A2 learners. VOICES below can hold two voices that take turns, like the
two speakers in the real exam. Pass --all to re-record every clip after changing a voice.

One-time setup (outside the repo):
  python3 -m venv ~/piper && ~/piper/bin/pip install piper-tts
  for v in ronnie; do for e in onnx onnx.json; do curl -L -o ~/piper/nl_NL-$v-medium.$e \
    https://huggingface.co/rhasspy/piper-voices/resolve/main/nl/nl_NL/$v/medium/nl_NL-$v-medium.$e; done; done
Run from the repo root (needs node and ffmpeg):
  ~/piper/bin/python audio/make_audio.py ~/piper [--all]
Only missing clips are made, unless --all. Then run release.py as usual.
"""
import json, os, subprocess, sys, wave
from piper import PiperVoice
try:
    from piper import SynthesisConfig
except ImportError:
    SynthesisConfig = None

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
args = [a for a in sys.argv[1:] if not a.startswith("--")]
models = os.path.expanduser(args[0] if args else "~/piper")
redo = "--all" in sys.argv
# (model file, synthesis settings); clips take turns through this list
VOICES = [("nl_NL-ronnie-medium.onnx", dict(length_scale=1.22, noise_scale=0.4, noise_w_scale=0.5))]
extract = r'''
const fs = require("fs"); const r = new Function(fs.readFileSync(process.argv[1], "utf8") + ";return {CIVIC, EXTRA};")();
function hashId(s){ let h = 5381; s = String(s); for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }
const t = new Set(); r.CIVIC.STAGES.forEach(s => s.qs.forEach(q => { if (q.audio) t.add(q.audio); })); r.EXTRA.civic.forEach(q => { if (q.audio) t.add(q.audio); });
console.log(JSON.stringify([...t].map(x => ({h:hashId(x), t:x}))));
'''
clips = json.loads(subprocess.run(["node", "-e", extract, os.path.join(root, "js/content.js")], capture_output=True, text=True, check=True).stdout)
voices = [(PiperVoice.load(os.path.join(models, m)), cfg) for m, cfg in VOICES]
out = os.path.join(root, "audio"); made = 0
for i, c in enumerate(clips):
    mp3 = os.path.join(out, c["h"] + ".mp3")
    if os.path.exists(mp3) and not redo: continue
    wav = mp3[:-4] + ".wav"
    with wave.open(wav, "wb") as wf:
        v, cfg = voices[i % len(voices)]
        if SynthesisConfig: v.synthesize_wav(c["t"], wf, syn_config=SynthesisConfig(**cfg))
        else: v.synthesize_wav(c["t"], wf)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav, "-af", "adelay=250,apad=pad_dur=0.3,loudnorm=I=-16", "-ac", "1", "-ar", "24000", "-b:a", "48k", mp3], check=True)
    os.remove(wav); made += 1
have = sorted(f[:-4] for f in os.listdir(out) if f.endswith(".mp3"))
open(os.path.join(root, "js/audio.js"), "w").write("/* Listening clips that have a recorded file in audio/. Written by audio/make_audio.py. */\nwindow.KLAAR_AUDIO = " + json.dumps(have) + ";\n")
print("made", made, "clips;", len(have), "in total")
