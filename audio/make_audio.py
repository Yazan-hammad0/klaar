#!/usr/bin/env python3
"""Record natural Dutch audio for every listening question (anything with an `audio` text in js/content.js).

Two speakers take turns, like in the real exam, both 22% slower for A2 learners:
  1. ronnie: Piper nl_NL-ronnie (CC0), tuned for clear speech (less noise).
  2. a female voice: ronnie's Netherlands Dutch speech turned into the sound of Piper nl_BE-nathalie (CC0)
     with kNN-VC (MIT). Nathalie herself speaks Belgian Dutch; this keeps ronnie's pronunciation.
Pass --all to re-record every clip after changing a voice.

One-time setup (outside the repo, about 2 GB):
  python3 -m venv ~/piper && ~/piper/bin/pip install piper-tts soundfile torch torchaudio --extra-index-url https://download.pytorch.org/whl/cpu
  for v in nl_NL/ronnie nl_BE/nathalie; do for e in onnx onnx.json; do curl -L -o ~/piper/$(echo $v | tr / -)-medium.$e \
    https://huggingface.co/rhasspy/piper-voices/resolve/main/nl/$v/medium/$(echo $v | tr / -)-medium.$e; done; done
  git clone --depth 1 https://github.com/bshall/knn-vc ~/knnvc
  mkdir -p ~/.cache/torch/hub/checkpoints && cd ~/.cache/torch/hub/checkpoints && for f in prematch_g_02500000.pt WavLM-Large.pt; do \
    curl -LO https://github.com/bshall/knn-vc/releases/download/v0.1/$f; done
Run from the repo root (needs node and ffmpeg):
  ~/piper/bin/python audio/make_audio.py ~/piper [--all]
Only missing clips are made, unless --all. Then run release.py as usual.
"""
import glob, json, os, subprocess, sys, wave
from piper import PiperVoice, SynthesisConfig

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
args = [a for a in sys.argv[1:] if not a.startswith("--")]
models = os.path.expanduser(args[0] if args else "~/piper")
redo = "--all" in sys.argv
RONNIE = "nl_NL-ronnie-medium.onnx"
# (Piper model, settings, voice to convert into or None); clips take turns through this list
VOICES = [(RONNIE, dict(length_scale=1.22, noise_scale=0.4, noise_w_scale=0.5), None),
          (RONNIE, dict(length_scale=1.17, noise_scale=0.4, noise_w_scale=0.5), "nl_BE-nathalie-medium.onnx")]
# a clip where the speaker says their name gets the matching voice; others take turns
NAMES = {0: ["Mark", "Pieter"], 1: ["Karin", "Linda"]}
def voice_for(i, text):
    for v, names in NAMES.items():
        if any("met " + n in text for n in names): return VOICES[v]
    return VOICES[i % len(VOICES)]
extract = r'''
const fs = require("fs"); const r = new Function(fs.readFileSync(process.argv[1], "utf8") + ";return {CIVIC, EXTRA};")();
function hashId(s){ let h = 5381; s = String(s); for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }
const t = new Set(), ref = new Set(), add = x => { if (typeof x === "string" && x.length > 25) ref.add(x); };
r.CIVIC.STAGES.forEach(s => s.qs.forEach(q => { if (q.audio) t.add(q.audio); add(q.audio); add(q.p); }));
r.EXTRA.civic.forEach(q => { if (q.audio) t.add(q.audio); add(q.audio); add(q.p); });
console.log(JSON.stringify({clips: [...t].map(x => ({h:hashId(x), t:x})), ref: [...ref]}));
'''
data = json.loads(subprocess.run(["node", "-e", extract, os.path.join(root, "js/content.js")], capture_output=True, text=True, check=True).stdout)
clips = data["clips"]
out = os.path.join(root, "audio"); made = 0
loaded = {}
def piper(m):
    if m not in loaded: loaded[m] = PiperVoice.load(os.path.join(models, m))
    return loaded[m]
def ff(src, dst, *opts): subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", src, *opts, dst], check=True)

converters = {}
def converter(target):
    """kNN-VC with a matching set of the target voice reading all Dutch texts in the app (made once, kept in models/)."""
    if target in converters: return converters[target]
    import torch, torchaudio, soundfile as sf
    def load(path, *a, **k):  # newer torchaudio needs torchcodec to read files; soundfile does the same job
        x, sr = sf.read(str(path), dtype="float32", always_2d=True); return torch.from_numpy(x.T.copy()), sr
    torchaudio.load = load
    sys.path.insert(0, os.path.expanduser("~/knnvc"))
    from hubconf import knn_vc
    refdir = os.path.join(models, "ref-" + target.split(".")[0])
    if not glob.glob(os.path.join(refdir, "*.wav")):
        os.makedirs(refdir, exist_ok=True)
        for k, t in enumerate(data["ref"]):
            tmp = os.path.join(refdir, "tmp.wav")
            with wave.open(tmp, "wb") as wf: piper(target).synthesize_wav(t, wf, syn_config=SynthesisConfig(length_scale=1.05))
            ff(tmp, os.path.join(refdir, "%03d.wav" % k), "-ar", "16000", "-ac", "1"); os.remove(tmp)
    vc = knn_vc(pretrained=True, progress=False, prematched=True, device="cpu")
    converters[target] = (vc, vc.get_matching_set(sorted(glob.glob(os.path.join(refdir, "*.wav")))), sf)
    return converters[target]

for i, c in enumerate(clips):
    mp3 = os.path.join(out, c["h"] + ".mp3")
    if os.path.exists(mp3) and not redo: continue
    model, cfg, target = voice_for(i, c["t"])
    wav = mp3[:-4] + ".wav"
    with wave.open(wav, "wb") as wf: piper(model).synthesize_wav(c["t"], wf, syn_config=SynthesisConfig(**cfg))
    if target:
        vc, ms, sf = converter(target)
        w16 = mp3[:-4] + ".16k.wav"; ff(wav, w16, "-ar", "16000", "-ac", "1")
        sf.write(wav, vc.match(vc.get_features(w16), ms, topk=4).numpy(), 16000); os.remove(w16)
    ff(wav, mp3, "-af", "adelay=250,apad=pad_dur=0.3,loudnorm=I=-16", "-ac", "1", "-ar", "24000", "-b:a", "48k")
    os.remove(wav); made += 1
have = sorted(f[:-4] for f in os.listdir(out) if f.endswith(".mp3"))
open(os.path.join(root, "js/audio.js"), "w").write("/* Listening clips that have a recorded file in audio/. Written by audio/make_audio.py. */\nwindow.KLAAR_AUDIO = " + json.dumps(have) + ";\n")
print("made", made, "clips;", len(have), "in total")
