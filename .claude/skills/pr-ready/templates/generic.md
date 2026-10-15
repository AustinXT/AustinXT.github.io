# pr-ready 模版 · generic（通用兜底）

当前项目无内置模版时用本通用模版——**一切以本项目的 AGENTS.md 及其引用的协议 / memory 为准**。

## §invariant 触发表

先读本项目根 `AGENTS.md` 及其引用的开工协议；缺失时兼容读 `CLAUDE.md`，找类似「改代码前必读 MEMORY 触发表」的章节；按 diff 涉及的概念 cat 对应 memory。
**若项目没有这类表 → 跳过 invariant 加载**，直接进 Step 3 的三视角对抗自检。

## §评审维度

按项目技术栈自适应（Agent 2「并发/资源安全」维度）：
- **Web/DB 后端** → 事务一致性 / CAS 守卫 / 锁竞争 / 幂等 / 失败回滚。
- **Rust/C/C++ 系统** → unsafe 不变量 / Send-Sync / FFI 边界 / RAII / panic 安全 / 数据竞争。
- **前端** → 状态/缓存一致性 / 异步时序 / 错误表面 / 列表过滤多入口。
- **不确定** → 用通用三问：①共享状态有没有竞争？②失败路径资源/状态是否正确回滚？③重复执行是否幂等？

边界（Agent 3）通用：空/零/极大输入、off-by-one、单位混淆、null/undefined、跨文件常量漂移。
sibling（Agent 1）通用：改一处反模式 grep 全 repo 同源。

## §验收命令

读本项目开工协议 / README / Makefile 的「测试·检查」命令；列为 checkbox。常见：
- Rust：`cargo fmt --check` / `cargo clippy` / `cargo test`
- Node/TS：`npm|bun run typecheck` / `test` / `lint`
- Python：`ruff` / `pytest`
- 通用：`make test` / `make lint`
