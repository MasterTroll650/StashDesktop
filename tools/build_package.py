"""Build public packages from explicit file lists."""
import hashlib
import json
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import yaml

ROOT = Path(__file__).resolve().parents[1]
def main():
    release = json.loads((ROOT / 'release.json').read_text())
    manifest = yaml.safe_load((ROOT / 'StashDesktop.yml').read_text())
    assert manifest['version'] == release['version']
    out = ROOT / 'dist'
    out.mkdir(exist_ok=True)
    packages = {
        'StashDesktop.zip': ['StashDesktop.yml', 'stash-desktop.js', 'README.md', 'LICENSE'],
        'StashDesktop-Windows.zip': ['README.md', 'LICENSE'] + ['windows/' + name for name in ['Install.cmd', 'Install.ps1', 'Launch-StashExplorer.vbs', 'Open-StashExplorer.ps1', 'PathRules.ps1']],
    }
    for name, files in packages.items():
        with ZipFile(out / name, 'w', ZIP_DEFLATED) as archive:
            for file in files:
                archive.write(ROOT / file, file)
    digest = hashlib.sha256((out / 'StashDesktop.zip').read_bytes()).hexdigest()
    entry = dict(id='StashDesktop', name='Stash Desktop', version=release['version'], date=release['date'] + ' 00:00:00', path=f"https://github.com/MasterTroll650/StashDesktop/releases/download/v{release['version']}/StashDesktop.zip", sha256=digest, metadata={'description': manifest['description']})
    (out / 'index.yml').write_text(yaml.safe_dump([entry], sort_keys=False), encoding='utf-8')
    print('Built browser plugin, Windows helper and source index.')

if __name__ == '__main__':
    main()
