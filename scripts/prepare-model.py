"""Developer-only: losslessly convert the original cached NPZ voice tables."""
import hashlib
import json
import shutil
from pathlib import Path
import numpy as np

root = Path(__file__).resolve().parent.parent
snapshots = root / '.model-cache/hub/models--KittenML--kitten-tts-nano-0.8-int8/snapshots'
source = next(snapshots.glob('*/voices.npz')).parent
destination = root / 'extension/models'
destination.mkdir(parents=True, exist_ok=True)
for name in ['kitten.onnx', 'config.json']:
    if (destination / name).exists():
        (destination / name).chmod(0o644)
shutil.copyfile(source / 'kitten_tts_nano_v0_8.onnx', destination / 'kitten.onnx')
shutil.copyfile(source / 'config.json', destination / 'config.json')
voices = np.load(source / 'voices.npz')
manifest, arrays, offset = {}, [], 0
for voice in voices.files:
    array = voices[voice].astype('<f4')
    manifest[voice] = {'offset': offset, 'rows': array.shape[0], 'width': array.shape[1]}
    arrays.append(array.tobytes())
    offset += array.size
(destination / 'voices.bin').write_bytes(b''.join(arrays))
(destination / 'voices.json').write_text(json.dumps(manifest, indent=2))
(destination / 'PROVENANCE.json').write_text(json.dumps({
    'repository': 'KittenML/kitten-tts-nano-0.8-int8',
    'revision': source.name,
    'source_voices_sha256': hashlib.sha256((source / 'voices.npz').read_bytes()).hexdigest(),
    'files': {name: hashlib.sha256((destination / name).read_bytes()).hexdigest()
              for name in ['kitten.onnx', 'voices.bin', 'voices.json', 'config.json']}
}, indent=2))
print('Prepared model assets and provenance checksums.')
