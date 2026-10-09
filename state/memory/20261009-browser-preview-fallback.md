---
name: browser-preview-fallback
description: Chrome 无 DevToolsActivePort 时停止盲重试，实际 HTTP 取证与浏览器验收分开。
type: feedback
---

## 为什么

2026-10-09 多轮任务遇到同一 Chrome DevTools 入口缺失；HTML／HTTP 可取得，但重复连接并不改变浏览器未开启调试的事实。把框架构建与 HTTP 成功当成视觉或点击验收，会制造假通过。本次实际八路由和资源请求证据见 `../../docs/reviews/007_next-stack-bootstrap.md`。

## 怎么用

同一环境首次返回“无 DevToolsActivePort”后，不在条件未变化时反复连接。继续用已授权的本地构建、DOM 与实际 HTTP 冒烟，明确标浏览器运行态、点击和手机未验证。若要真正浏览器验收，先由负责人改变／明确授权入口条件，不自行改个人配置、重启浏览器、安装驱动或改用未经批准工具。临时本地服务仅绑定回环地址，完成验证后停止；HTTP 200 不等于渲染、人审或上线成功。
