#!/usr/bin/env python3
"""只读核对三篇候选的本地生成 URL；不构建、不访问网络、不修改原件。"""

import argparse
import hashlib
import json
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import xml.etree.ElementTree as ET


class PageEvidence(HTMLParser):
    def __init__(self):
        super().__init__()
        self.canonical = []
        self.refresh = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "link" and attrs.get("rel") == "canonical":
            self.canonical.append(attrs.get("href"))
        if tag == "meta" and attrs.get("http-equiv", "").lower() == "refresh":
            self.refresh.append(attrs.get("content"))


def inspect(root):
    candidates = [
        ("2019-12-23-卡片学习心得", "卡片大法"),
        ("2019-08-04-解读统计数字四步骤", "解读统计数字的行动清单"),
        ("2018-01-07-quickenter-new-academic-realm", "如何快速了解一个学术领域"),
    ]
    sitemap = root / "public/sitemap.xml"
    locations = [
        node.text or ""
        for node in ET.parse(sitemap).iter()
        if node.tag.rsplit("}", 1)[-1] == "loc"
    ]
    results = []
    for filename, title in candidates:
        source = root / "content/posts" / (filename + ".md")
        item = {
            "source": str(source.relative_to(root)),
            "sha256": hashlib.sha256(source.read_bytes()).hexdigest(),
            "sitemap_urls": [
                url for url in locations
                if unquote(urlsplit(url).path).strip("/") in {filename, title}
            ],
            "generated_pages": [],
        }
        for name in (filename, title):
            page = root / "public" / name / "index.html"
            evidence = {"path": str(page.relative_to(root)), "exists": page.is_file()}
            if page.is_file():
                parser = PageEvidence()
                parser.feed(page.read_text(encoding="utf-8"))
                evidence.update(canonical=parser.canonical, refresh=parser.refresh)
            item["generated_pages"].append(evidence)
        results.append(item)
    return {"scope": "仅本地生成物，不能证明线上 URL 或发布许可", "candidates": results}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("root", type=Path, help="旧博客原件根目录")
    args = parser.parse_args()
    print(json.dumps(inspect(args.root), ensure_ascii=False, indent=2))
