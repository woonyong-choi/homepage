"""생성된 전체 문서의 구조와 로컬 링크·자산을 확인한다."""
from __future__ import annotations

from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent.parent


class Page(HTMLParser):
    def __init__(self, path: Path) -> None:
        super().__init__()
        self.path = path
        self.ids = []
        self.links = []
        self.headings = 0
        self.styles = []
        self.feed(path.read_text())

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attrs = dict(attrs)
        if attrs.get('id'):
            self.ids.append(attrs['id'])
        if tag == 'h1':
            self.headings += 1
        if tag == 'link' and attrs.get('rel') == 'stylesheet':
            self.styles.append(Path(urlsplit(attrs.get('href', '')).path).name)
        for name in ('href', 'src'):
            if attrs.get(name):
                self.links.append(attrs[name])


def main() -> bool:
    pages = {path.resolve(): Page(path) for path in [ROOT / 'index.html', *sorted((ROOT / 'pages').rglob('index.html'))]}
    errors = []
    for path, page in pages.items():
        name = str(path.relative_to(ROOT))
        if page.headings != 1:
            errors.append(f'{name}: expected one h1, got {page.headings}')
        for identifier, count in Counter(page.ids).items():
            if count > 1:
                errors.append(f'{name}: duplicate id {identifier}')
        if not {'theme.css', 'styles.css'}.issubset(page.styles):
            errors.append(f'{name}: shared theme stylesheet missing')
        for raw in page.links:
            url = urlsplit(raw)
            if url.scheme or url.netloc:
                continue
            target = (ROOT / unquote(url.path).lstrip('/') if url.path.startswith('/') else path.parent / unquote(url.path)).resolve() if url.path else path
            if target.is_dir():
                target /= 'index.html'
            if not target.exists():
                errors.append(f'{name}: missing local target {raw}')
            elif url.fragment and target in pages and unquote(url.fragment) not in pages[target].ids:
                errors.append(f'{name}: missing heading {raw}')
    print(f'checked {len(pages)} pages; total {len(errors)}')
    for error in errors:
        print(error)
    return bool(errors)


if __name__ == '__main__':
    raise SystemExit(main())
