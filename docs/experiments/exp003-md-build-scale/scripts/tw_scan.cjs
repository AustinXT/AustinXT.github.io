// 用已安装的 @tailwindcss/oxide 列出自动源检测会扫描的文件（只读，不构建）
const path = require("node:path");
const base = process.argv[2];
const { Scanner } = require(path.join(base, "node_modules/@tailwindcss/oxide"));
const s = new Scanner({ sources: [{ base, pattern: "**/*", negated: false }] });
const cands = s.scan();
const files = s.files;
const byTop = {};
for (const f of files) {
  const rel = path.relative(base, f).split(path.sep);
  const k = rel.length > 1 ? rel[0] + "/" : rel[0];
  byTop[k] = (byTop[k] || 0) + 1;
}
console.log(JSON.stringify({ base, files: files.length, candidates: cands.length, byTop }, null, 1));
