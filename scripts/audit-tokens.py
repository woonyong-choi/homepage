"""원본 보존, 생성물 재현성, 사이트의 디자인 값 참조를 검사한다."""
import hashlib
import json
import re
import subprocess
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

from check_tokens import load_token_info, check_file, find_segments, find_hardcoded

ROOT = Path(__file__).resolve().parent.parent
CONFIG = json.loads((ROOT / 'token-audit.json').read_text())

def audit():
    findings = []
    for name, digest in CONFIG['preserved'].items():
        path = ROOT / name
        if not path.is_file() or hashlib.sha256(path.read_bytes()).hexdigest() != digest:
            findings.append(f'{name}: preserved source changed')
    subprocess.run(['node', 'scripts/build-tokens.mjs', '--check'], cwd=ROOT, check=True)
    info = load_token_info(str(ROOT / 'tokens.json'))
    checked = 0
    for path in ROOT.rglob('*'):
        if not path.is_file():
            continue
        name = path.relative_to(ROOT).as_posix()
        if any(part in {'.git', 'node_modules', 'scripts', 'test', 'vendor', 'dist'} for part in path.relative_to(ROOT).parts):
            continue
        if name in CONFIG['preserved'] or name in CONFIG['generated']:
            continue
        if path.suffix not in {'.css', '.html', '.svg', '.js', '.mjs', '.jsx', '.tsx', '.ts', '.md'}:
            continue
        checked += 1
        if '생성물, 손으로 고치지 않음' in path.read_text().split('\n', 1)[0]:
            findings.append(f'{name}: unregistered generated source')
        if path.suffix in {'.svg', '.md'}:
            text = path.read_text()
            if path.suffix == '.svg':
                try:
                    ET.fromstring(text)
                except ET.ParseError as error:
                    findings.append(f'{name}: invalid svg xml: {error}')
            # 각 SVG에 삽입한 토큰 선언은 앞의 재생성 비교로 검증한다.
            text = re.sub(r'<style data-site-tokens(?:="")?>[\s\S]*?</style>', '', text)
            if path.suffix == '.md':
                text = re.sub(r'```[^\n]*\n[\s\S]*?```', '', text)
            for offset, segment, styled in find_segments(text, '.html'):
                findings.extend(f'{name}: {rule}: {snippet}' for _, rule, snippet in find_hardcoded(segment, info, styled))
        else:
            findings.extend(f'{name}:{line}: {rule}: {snippet}' for _, line, rule, snippet in check_file(str(path), info))
    for name, markup in json.loads((ROOT / 'assets/docs-tool-icons.json').read_text()).items():
        for _, segment, styled in find_segments(markup, '.html'):
            findings.extend(f'docs-tool-icons {name}: {rule}: {snippet}' for _, rule, snippet in find_hardcoded(segment, info, styled))
    for finding in findings:
        print(finding)
    print(f'checked {checked} files; total {len(findings)}')
    return bool(findings)

if __name__ == '__main__':
    sys.exit(audit())
