#!/usr/bin/env python3
"""只在自建临时夹具中测试；不读写实际参考原件或作品。"""
import importlib.util
import platform
import subprocess
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().with_name("check-system.py")
SPEC = importlib.util.spec_from_file_location("project_checker", SCRIPT)
CHECKER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(CHECKER)


class StructureTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="manzi-blog-rules-")
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve()
        subprocess.run(["git", "init", "-q", str(self.root)], check=True)
        for relative in CHECKER.REQUIRED:
            path = self.root / relative
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text("fixture\n", encoding="utf-8")
        (self.root / "vault/raw").mkdir(parents=True)
        self.write(".python-version", platform.python_version() + "\n")
        self.write(".gitignore", "/vault/raw/05blog/\n.env\n.env.*\n_tmp/\n")
        self.write(".42cog/intent.md", "## 收敛方向（唯一）\n\n可读且可追溯的博客。\n\n## 下一步\n调查。\n")
        self.write(".42cog/cog.md", "| 实体 | 是什么 | 存在哪 | 谁产生 | 谁是谁的输入 |\n|---|---|---|---|---|\n")
        for name in CHECKER.METHODS:
            self.write(f"skills/{name}/SKILL.md", f"---\nname: {name}\ndescription: fixture\n---\n正文。\n")

    def write(self, relative, text):
        path = self.root / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")

    def errors(self):
        return CHECKER.check(self.root)

    def test_valid(self):
        self.assertEqual([], self.errors())

    def test_missing_document(self):
        (self.root / ".42cog/meta.md").unlink()
        self.assertTrue(any("缺文件" in error for error in self.errors()))

    def test_empty_direction(self):
        self.write(".42cog/intent.md", "## 收敛方向（唯一）\n\n## 下一步\n调查。\n")
        self.assertTrue(any("收敛方向" in error for error in self.errors()))

    def test_placeholder_direction(self):
        self.write(".42cog/intent.md", "## 收敛方向（唯一）\n\n（待 AI 起草）\n")
        self.assertTrue(any("收敛方向" in error for error in self.errors()))

    def test_wrong_python_version(self):
        self.write(".python-version", "0.0.0\n")
        self.assertTrue(any("版本不匹配" in error for error in self.errors()))

    def test_reference_ignore_missing(self):
        self.write(".gitignore", ".env.local\n_tmp/\n")
        self.assertTrue(any("保护路径未被忽略：vault/raw" in error for error in self.errors()))

    def test_reference_force_tracked(self):
        self.write("vault/raw/05blog/content/article.md", "人工夹具，不是真原件。\n")
        subprocess.run(["git", "-C", str(self.root), "add", "-f", "vault/raw/05blog/content/article.md"], check=True)
        self.assertTrue(any("原件被跟踪" in error for error in self.errors()))

    def test_secret_force_tracked(self):
        self.write(".env.local", "DUMMY=fixture\n")
        subprocess.run(["git", "-C", str(self.root), "add", "-f", ".env.local"], check=True)
        self.assertTrue(any("敏感文件被跟踪" in error for error in self.errors()))

    def test_dotenv_force_tracked(self):
        self.write(".env", "DUMMY=fixture\n")
        subprocess.run(["git", "-C", str(self.root), "add", "-f", ".env"], check=True)
        self.assertTrue(any("敏感文件被跟踪" in error for error in self.errors()))

    def test_dotenv_variant_force_tracked(self):
        self.write(".env.production.local", "DUMMY=fixture\n")
        subprocess.run(["git", "-C", str(self.root), "add", "-f", ".env.production.local"], check=True)
        self.assertTrue(any("敏感文件被跟踪" in error for error in self.errors()))

    def test_reference_gitlink_tracked(self):
        subprocess.run(["git", "-C", str(self.root), "update-index", "--add", "--cacheinfo",
                        "160000," + "1" * 40 + ",vault/raw/05blog"], check=True)
        self.assertTrue(any("原件被跟踪" in error for error in self.errors()))

    def test_module_unregistered(self):
        (self.root / "src/site").mkdir()
        self.assertTrue(any("作品子目录应唯一登记" in error for error in self.errors()))

    def test_module_exact_registered(self):
        (self.root / "src/site").mkdir()
        self.write(".42cog/cog.md", "| 网站 | 阅读模块 | `../src/site/` | AI | 构建输入 |\n")
        self.assertEqual([], self.errors())

    def test_module_duplicate_registration(self):
        (self.root / "src/site").mkdir()
        row = "| 网站 | 阅读模块 | `../src/site/` | AI | 构建输入 |\n"
        self.write(".42cog/cog.md", row + row)
        self.assertTrue(any("实际 2 行" in error for error in self.errors()))

    def test_entity_empty_field(self):
        self.write(".42cog/cog.md", "| 网站 | 阅读模块 | `../src/site/` | | 构建输入 |\n")
        self.assertTrue(any("空字段" in error for error in self.errors()))

    def test_symlink_required_file(self):
        path = self.root / "README.md"
        path.unlink()
        path.symlink_to(self.root / "CLAUDE.md")
        self.assertTrue(any("软链接：README.md" in error for error in self.errors()))

    def test_symlink_module(self):
        (self.root / "src/site").symlink_to(self.root / "vault/raw", target_is_directory=True)
        self.assertTrue(any("作品区不接受软链接" in error for error in self.errors()))

    def test_symlink_method_parent(self):
        path = self.root / "skills/mb-init/SKILL.md"
        path.unlink()
        path.parent.rmdir()
        path.parent.symlink_to(self.root / "skills/mb-research", target_is_directory=True)
        self.assertTrue(any("方法路径含软链接" in error for error in self.errors()))

    def test_wrong_method_name(self):
        self.write("skills/mb-proto/SKILL.md", "---\nname: mb-mini\ndescription: fixture\n---\n正文。\n")
        self.assertTrue(any("方法名称与目录不一致" in error for error in self.errors()))

    def test_wrong_repository_root(self):
        subprocess.run(["git", "-C", str(self.root), "config", "core.worktree", str(self.root.parent)], check=True)
        self.assertTrue(any("不是独立 Git 仓库" in error for error in self.errors()))


if __name__ == "__main__":
    unittest.main(verbosity=2)
