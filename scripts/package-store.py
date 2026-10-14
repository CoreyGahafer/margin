"""Package explicit public inputs only; exclude caches, keys, and user files."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import hashlib
import json

root = Path(__file__).resolve().parent.parent
kit = root / 'store-kit'
dist = root / 'dist'
dist.mkdir(exist_ok=True)
sources = kit / 'application-source.zip'
with ZipFile(sources, 'w', ZIP_DEFLATED) as archive:
    for folder in ['extension', 'scripts', 'tests', 'server']:
        for path in (root / folder).rglob('*'):
            if path.is_file() and '__pycache__' not in path.parts and path.name not in ['.DS_Store', '.pairing-key']:
                archive.write(path, path.relative_to(root))
    for name in ['package.json', 'package-lock.json', 'README.md', '.gitignore', 'LICENSE']:
        archive.write(root / name, name)
    archive.write(kit / 'legal/RELEASE-REVIEW.md', 'RELEASE-REVIEW.md')

hash_file = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()
dependencies = {
    'ephone': {
        'version': '1.0.2', 'license': 'GPL-3.0-or-later',
        'revision': '4f6d246c1d3acf67a4d814e20da02fa3967bc92d',
        'source_url': 'https://github.com/sjmik/ephone-js/archive/4f6d246c1d3acf67a4d814e20da02fa3967bc92d.zip',
        'source_sha256': hash_file(kit / 'legal/ephone-1.0.2-source.zip'),
        'runtime_sha256': hash_file(root / 'extension/vendor/ephone/ephone.mjs')
    },
    'onnxruntime': {
        'version': '1.30.0', 'license': 'MIT',
        'source_url': 'https://github.com/microsoft/onnxruntime/archive/refs/tags/v1.30.0.zip',
        'source_sha256': hash_file(kit / 'legal/onnxruntime-1.30.0-source.zip'),
        'runtime_sha256': hash_file(root / 'extension/vendor/ort/ort-wasm-simd-threaded.wasm')
    },
    'model': json.loads((root / 'extension/models/PROVENANCE.json').read_text()),
    'application_license': json.loads((root / 'package.json').read_text()).get('license', 'Publisher decision pending; not assigned by preparation task')
}
(kit / 'legal/DEPENDENCIES.json').write_text(json.dumps(dependencies, indent=2) + '\n')
with ZipFile(dist / 'margin-source-materials.zip', 'w', ZIP_DEFLATED) as archive:
    archive.write(sources, 'source-materials/application-source.zip')
    for path in (kit / 'legal').iterdir():
        if path.is_file():
            archive.write(path, Path('source-materials/legal') / path.name)
with ZipFile(dist / 'margin-store-kit.zip', 'w', ZIP_DEFLATED) as archive:
    for path in kit.rglob('*'):
        if path.is_file() and path.name != '.DS_Store' and not path.name.endswith('source.zip'):
            archive.write(path, Path('store-kit') / path.relative_to(kit))
    archive.write(dist / 'margin-extension.zip', 'margin-extension.zip')
print('Created application-source.zip, margin-source-materials.zip, and margin-store-kit.zip.')
