// 用显式 sources 复核扫描集合（模拟 source(none) + @source 列表）
const path = require("node:path");
const base = process.argv[2];
const { Scanner } = require(path.join(base, "node_modules/@tailwindcss/oxide"));
const dirs = ["app", "components", "lib"].map((d) => ({ base: path.join(base, d), pattern: "**/*", negated: false }));
const files = ["README.md", "package.json", "tsconfig.json", "next.config.ts", "postcss.config.mjs", "eslint.config.mjs"]
  .map((f) => ({ base, pattern: f, negated: false }));
const s = new Scanner({ sources: [...dirs, ...files] });
const c = s.scan();
console.log(JSON.stringify({ files: s.files.length, candidates: c.length, list: s.files.map((f) => path.relative(base, f)) }));
