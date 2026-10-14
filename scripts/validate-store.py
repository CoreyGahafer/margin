"""Validate the actual uploaded ZIP and CWS artwork dimensions."""
from pathlib import Path
from zipfile import ZipFile
import hashlib
import json
from PIL import Image

root = Path(__file__).resolve().parent.parent
expected = {
    'store-icon-128.png': (128, 128), 'promo-440x280.png': (440, 280),
    'marquee-1400x560.png': (1400, 560),
    'screenshot-01-1280x800.png': (1280, 800), 'screenshot-02-1280x800.png': (1280, 800),
    'screenshot-03-streaming-1280x800.png': (1280, 800)
}
for name, size in expected.items():
    path = root / 'store-kit/assets' / name
    with Image.open(path) as image:
        assert image.format == 'PNG', name
        assert image.size == size, (name, image.size)
        assert image.mode in ('RGB', 'RGBA'), (name, image.mode)

with ZipFile(root / 'dist/margin-extension.zip') as archive:
    assert archive.testzip() is None
    manifest = json.loads(archive.read('manifest.json'))
    assert manifest['version'] == '0.3.1'
    assert 'storage' not in manifest['permissions']
    assert 'host_permissions' not in manifest
    assert all('127.0.0.1' not in archive.read(name).decode() for name in ['panel.js', 'manifest.json'])
    assert not any('phonemizer' in name for name in archive.namelist())
    assert not any(name.endswith(('.pairing-key', '.DS_Store')) for name in archive.namelist())
    assert all(name in archive.namelist() for name in [
        'stream-player.js', 'tts-worker.mjs', 'tts-core.mjs', 'models/kitten.onnx',
        'models/voices.bin', 'vendor/ephone/ephone.mjs', 'vendor/ephone/lang/en-us.js',
        'vendor/ephone/COPYING', 'vendor/ort/ort-wasm-simd-threaded.wasm', 'privacy.html'
    ])
    for size, name in manifest['icons'].items():
        with archive.open(name) as image_file:
            with Image.open(image_file) as image:
                assert image.size == (int(size), int(size)), name
    model = json.loads(archive.read('models/PROVENANCE.json'))
    for name, digest in model['files'].items():
        assert hashlib.sha256(archive.read('models/' + name)).hexdigest() == digest

print('Store package, icons, screenshots, promo dimensions, privacy page, and model checksums validated.')
