#!/usr/bin/env python3
"""只读检查初始化结构；不遍历原件、不执行旧代码、不判网站已可用。"""
import platform
import re
import subprocess
import sys
from pathlib import Path

REQUIRED = (
    "README.md", "CLAUDE.md", ".42cog/intent.md", ".42cog/real.md",
    ".42cog/cog.md", ".42cog/meta.md", "specs/README.md", "src/README.md",
    "state/board.md", "state/changelog.md", "state/memory/MEMORY.md",
    ".python-version", ".gitignore", "plugin.json", "42plugin.json",
)
METHODS = ("mb-init", "mb-research", "mb-proto", "mb-evolve")
PROTECTED = (
    "vault/raw/05blog/content/article.md", "vault/raw/05blog/.git/config",
    "vault/raw/05blog/tmp/local-data", ".env", ".env.local", ".env.production.local",
    ".env.production", "_tmp/20261009-test/local",
)


def safe_file(root, relative):
    path = root / relative
    return path.is_file() and not any(p.is_symlink() for p in (path, *path.parents) if p != root.parent)


def git(root, *args, input_text=None):
    return subprocess.run(
        ["git", "-c", "core.fsmonitor=false", "-c", "core.hooksPath=/dev/null", "-C", str(root), *args],
        input=input_text, text=True, capture_output=True, check=False,
    )


def check(root):
    root = root.resolve()
    errors = []
    for relative in REQUIRED:
        if not safe_file(root, relative):
            errors.append(f"缺文件或路径含软链接：{relative}")
    for relative in ("src", "skills", "vault/raw"):
        path = root / relative
        if not path.is_dir() or path.is_symlink() or any(p.is_symlink() for p in path.parents if p != root.parent):
            errors.append(f"缺目录或目录含软链接：{relative}")
    if errors:
        return errors

    expected = (root / ".python-version").read_text(encoding="utf-8").strip()
    if not re.fullmatch(r"\d+\.\d+\.\d+", expected):
        errors.append("Python 版本必须精确到补丁版本")
    elif expected != platform.python_version():
        errors.append(f"Python 版本不匹配：要求 {expected}，实际 {platform.python_version()}")

    intent = (root / ".42cog/intent.md").read_text(encoding="utf-8")
    direction = re.search(r"^## 收敛方向（唯一）\s*\n(.*?)(?=^## |\Z)", intent, re.M | re.S)
    if not direction or not direction.group(1).strip() or "待 AI 起草" in direction.group(1):
        errors.append("收敛方向缺失或仍是占位符")

    cog = (root / ".42cog/cog.md").read_text(encoding="utf-8")
    rows = []
    for line in cog.splitlines():
        if not line.startswith("|"):
            continue
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if not cells or cells[0] == "实体" or all(re.fullmatch(r"[-:]+", cell) for cell in cells):
            continue
        if len(cells) == 5:
            if any(not cell for cell in cells):
                errors.append("实体表存在空字段")
            rows.append(cells)
    for path in (root / "src").iterdir():
        if path.is_symlink():
            errors.append(f"作品区不接受软链接：{path.name}")
        elif path.is_dir():
            location = f"`../src/{path.name}/`"
            count = sum(row[2] == location for row in rows)
            if count != 1:
                errors.append(f"作品子目录应唯一登记：src/{path.name}/，实际 {count} 行")

    for name in METHODS:
        relative = f"skills/{name}/SKILL.md"
        if not safe_file(root, relative):
            errors.append(f"缺方法或方法路径含软链接：{name}")
            continue
        text = (root / relative).read_text(encoding="utf-8")
        frontmatter = re.match(r"\A---\n(.*?)\n---\n", text, re.S)
        if not frontmatter or not re.search(rf"^name: {re.escape(name)}$", frontmatter.group(1), re.M):
            errors.append(f"方法名称与目录不一致：{name}")

    top = git(root, "rev-parse", "--show-toplevel")
    if top.returncode or Path(top.stdout.strip()).resolve() != root:
        errors.append("项目根不是独立 Git 仓库")
        return errors
    ignored = git(root, "check-ignore", "--no-index", "--stdin", input_text="\n".join(PROTECTED) + "\n")
    ignored_paths = set(ignored.stdout.splitlines())
    for relative in PROTECTED:
        if relative not in ignored_paths:
            errors.append(f"保护路径未被忽略：{relative}")
    tracked = git(root, "ls-files", "-z")
    if tracked.returncode:
        errors.append("无法检查已跟踪文件")
    for relative in tracked.stdout.split("\0"):
        if not relative:
            continue
        path = Path(relative)
        if relative == "vault/raw/05blog" or relative.startswith("vault/raw/05blog/"):
            errors.append("旧博客原件被跟踪，不允许进入新仓库")
            continue
        if path.name == ".env" or path.name.startswith(".env.") or path.name.endswith(".key"):
            errors.append(f"敏感文件被跟踪：{relative}")
        full = root / path
        if not full.is_symlink() and full.is_file() and full.stat().st_size > 50 * 1024 * 1024:
            errors.append(f"超过 50 MB 的文件被跟踪：{relative}")
    return errors


def main():
    root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parent.parent
    try:
        errors = check(root)
    except (OSError, ValueError) as exc:
        print(f"✗ 无法完成规则检查：{exc}")
        return 1
    for error in errors:
        print(f"✗ {error}")
    if errors:
        return 1
    print("✓ 初始化结构、方法命名、实体登记、原件忽略与 Python 版本通过")
    print("· 不验证网站构建、内容真假、人审、跨谱系放行或线上发布")
    return 0


if __name__ == "__main__":
    sys.exit(main())
