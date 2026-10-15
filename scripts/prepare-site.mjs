// 只管理可再生的 public/media 与 out；图片原件始终放在 content/media。
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src");
const source = path.join(site, "content/media"), target = path.join(site, "public/media");
const allowed = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".svg", ".ico", ".pdf", ".mp3", ".mp4", ".webm", ".ogg"]);
const copies = [];
function walk(dir) {
  if (fs.lstatSync(dir).isSymbolicLink()) throw new Error(`媒体目录不能是软链接：${dir}`);
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`媒体不允许软链接：${full}`);
    if (entry.name.startsWith(".")) continue;
    if (entry.isDirectory()) walk(full);
    else {
      if (!entry.isFile() || !allowed.has(path.extname(entry.name).toLowerCase())) throw new Error(`不支持的媒体文件：${full}`);
      if (fs.statSync(full).size > 10 * 1024 * 1024) throw new Error(`媒体文件超过 10 MB：${full}`);
      copies.push([full, path.join(target, path.relative(source, full))]);
    }
  }
}
if (fs.existsSync(source)) walk(source);
// 全部输入合法后，替换派生媒体，并清除旧导出，避免已下架页面或图片残留。
fs.rmSync(target, { recursive: true, force: true });
for (const [from, to] of copies) { fs.mkdirSync(path.dirname(to), { recursive: true }); fs.copyFileSync(from, to); }
if (process.argv.includes("--build")) fs.rmSync(path.join(site, "out"), { recursive: true, force: true });
console.log(`媒体准备完成：${copies.length} 个文件。`);
