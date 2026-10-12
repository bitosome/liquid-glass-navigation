"""Make a deterministic integration ZIP with the same files HACS installs."""
from pathlib import Path
import runpy
import zipfile

ROOT = Path(__file__).resolve().parents[1]
runpy.run_path(str(ROOT / 'scripts/check_package.py'))
base = ROOT / 'custom_components'
target = ROOT / 'artifacts/liquid-glass-navigation.zip'
target.parent.mkdir(exist_ok=True)
with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED) as archive:
    for path in sorted((base / 'liquid_glass_navigation').rglob('*')):
        if path.is_file() and '__pycache__' not in path.parts and path.suffix not in ('.pyc', '.pyo'):
            info = zipfile.ZipInfo(str(path.relative_to(base)), date_time=(2026, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, path.read_bytes())
print(target)
