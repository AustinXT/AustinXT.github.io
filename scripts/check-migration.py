#!/usr/bin/env python3
"""迁移台账对账：每篇正文都在台账登记且只登记一次；声明「原样」的，与原件逐字比对。

只读台账、src/site/content/essays/*.md 与台账指向的原件。原件在被 Git 忽略的 vault/raw/ 下，
本机没有时（例如 CI）只做登记对账，并明说没有比对。不判语义、版权或本人声音。
check(ledger, sources, origins) 为纯函数，便于反例回归。用法：check-migration.py [仓库根]
"""
import os
import re
import stat
import sys
from pathlib import Path

LEDGER = 'docs/research/007_migration-ledger.md'
CONTENT = 'src/site/content/essays'
FRONT = re.compile(r'\A---\r?\n(.*?)\r?\n---\r?\n(.*)\Z', re.S)
HEADING = re.compile(r'^(#{1,6}) ', re.M)
MODES = ('原样', '改写')


def rows(ledger):
    parts = ledger.split('\n## 台账\n', 1)
    if len(parts) != 2:
        raise ValueError('台账缺「## 台账」一节')
    entries = []
    for line in parts[1].split('\n## ', 1)[0].splitlines():
        if line.startswith('| `'):
            cells = [cell.strip() for cell in line.strip().strip('|').split('|')]
            entries.append({'new': cells[0].strip('`'), 'origin': cells[1].strip('`'), 'mode': cells[2]})
    return entries


def split(text):
    match = FRONT.match(text)
    if not match:
        return None, text
    meta = {}
    for line in match.group(1).splitlines():
        key, sep, value = line.partition(':')
        if sep and key.strip() and not key.startswith((' ', '\t', '-')):
            meta[key.strip()] = value.strip().strip('\'"')
    return meta, match.group(2)


def lift(body):
    """声明过的唯一排版差异：标题整体上提一级，使最高一级成为 h2。"""
    levels = [len(mark) for mark in HEADING.findall(body)]
    shift = min(levels) - 2 if levels else 0
    return HEADING.sub(lambda m: m.group(1)[shift:] + ' ', body) if shift > 0 else body


def lines(body):
    return [line.rstrip() for line in body.strip('\n').splitlines()]


def check(ledger, sources, origins):
    """ledger：台账文本；sources：{相对路径: 新正文}；origins：{原件相对路径: 文本，本机没有则为 None}。
    返回 (errors, unchecked)，unchecked 是因原件不在本机而没有逐字比对的正文。"""
    errors, unchecked = [], []
    entries = rows(ledger)
    counts = {}
    for entry in entries:
        counts[entry['new']] = counts.get(entry['new'], 0) + 1
    for path in sorted(sources):
        if counts.get(path) != 1:
            errors.append(f'{path}：须在台账登记且只登记一次')
    for entry in entries:
        new, origin, mode = entry['new'], entry['origin'], entry['mode']
        if new not in sources:
            errors.append(f'{new}：台账登记了，正文不存在')
            continue
        if not origin.startswith('vault/raw/') or '..' in Path(origin).parts:
            errors.append(f'{new}：原件须指向 vault/raw/ 下的文件')
            continue
        if mode not in MODES:
            errors.append(f'{new}：保留方式须为「原样」或「改写」')
            continue
        original = origins.get(origin)
        if original is None:
            unchecked.append(new)
            continue
        (meta_new, body_new), (meta_old, body_old) = split(sources[new]), split(original)
        if meta_new is None or meta_old is None:
            errors.append(f'{new}：新正文或原件读不到 front matter')
            continue
        if meta_new.get('date') != meta_old.get('date'):
            errors.append(f'{new}：date 须等于原件的原始日期 {meta_old.get("date")}')
        if mode == '原样':
            want, got = lines(lift(body_old)), lines(body_new)
            if want != got:
                first = next((i for i, (a, b) in enumerate(zip(want, got)) if a != b), min(len(want), len(got)))
                errors.append(f'{new}：声明原样，但正文第 {first + 1} 行起与原件不同')
    return errors, unchecked


def safe(path):
    for component in reversed((path, *path.parents)):
        if stat.S_ISLNK(component.lstat().st_mode):
            raise ValueError('不允许软链接：' + str(component))


def read(path):
    safe(path)
    fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW)
    with os.fdopen(fd, encoding='utf-8') as stream:
        return stream.read()


def load(root):
    root = Path(os.path.abspath(root))
    ledger = read(root / LEDGER)
    content = root / CONTENT
    safe(content)
    sources = {f'{CONTENT}/{p.name}': read(p) for p in sorted(content.glob('*.md'))}
    origins = {}
    for entry in rows(ledger):
        path = root / entry['origin']
        if '..' not in Path(entry['origin']).parts and path.is_file():
            origins[entry['origin']] = read(path)
    return ledger, sources, origins


def main(argv=None):
    argv = sys.argv[1:] if argv is None else argv
    if len(argv) > 1:
        print('用法：check-migration.py [仓库根]', file=sys.stderr)
        return 2
    root = argv[0] if argv else Path(__file__).absolute().parent.parent
    try:
        ledger, sources, origins = load(root)
        errors, unchecked = check(ledger, sources, origins)
    except (OSError, ValueError, UnicodeError) as exc:
        print('检查无法完成：' + str(exc), file=sys.stderr)
        return 2
    for error in errors:
        print(error, file=sys.stderr)
    if errors:
        return 1
    note = f'；{len(unchecked)} 篇的原件不在本机，没有逐字比对' if unchecked else ''
    print(f'迁移台账对账通过：{len(sources)} 篇正文均已登记{note}。不代表语义保真、版权或本人声音。')
    return 0


if __name__ == '__main__':
    sys.exit(main())
