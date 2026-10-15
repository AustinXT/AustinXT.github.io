import assert from "node:assert/strict";
import test from "node:test";
import { searchEntries } from "../src/lib/search.ts";
const entry = (title, extra = {}) => ({ title, href: `/essays/${title}/`, description: "", date: "2026-10-15", categories: [], tags: [], kind: "essay", ...extra });
test("中文、多词、大小写与全角归一；跨字段匹配", () => {
  const all = [entry("卡片大法", { tags: ["写作", "AI"] }), entry("ai工具", { description: "卡片与阅读" })];
  assert.equal(searchEntries(all, "  ＡＩ   卡片 ").length, 2);
  assert.equal(searchEntries(all, "卡片 写作")[0].title, "卡片大法");
  assert.deepEqual(searchEntries(all, "不存在"), []);
  assert.deepEqual(searchEntries(all, "   "), []);
});
test("标题优先，类型过滤，特殊符号按普通文字处理", () => {
  const all = [entry("介绍", { description: "GitHub 探索" }), entry("GitHub", { kind: "work" }), entry("C++ [工具]")];
  assert.equal(searchEntries(all, "github")[0].kind, "work");
  assert.equal(searchEntries(all, "github", "essay").length, 1);
  assert.equal(searchEntries(all, "C++ [").length, 1);
  assert.deepEqual(searchEntries(all, "(.*)"), []);
});
