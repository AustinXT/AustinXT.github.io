# 智能时代蛮子 · 博客 · 项目身份

## 身份与位置

- 系统名：智能时代蛮子 · 博客；系统码：`mb`。
- 负责人：用户本人；创建日期：2026-10-09。
- 项目类型：独立个人博客工程，不是多平台营销仓库。
- 本地目录：`/Users/nv/proj.xt.com/manzi-blog`。
- 作品区：`src/`；作品单位与实体关系见 `cog.md`。
- 方向唯一正本：`intent.md`；方向草稿尚待负责人确认。
- 本项目远程仓库：用户于 2026-10-09 明确指定 https://github.com/AustinXT/AustinXT.github.io，已配置为 `origin`；工作分支为 `dev`，独立初始化历史，保留既有远端 `main` 不动。
- 与默认六组的差异：无；本地原件目录完整忽略，不纳入本项目版本库。
- 状态与放行：以 `../state/board.md` 为接续正本；尚未形成网站成品。

## 参考与上下游登记

| 角色 | 身份或位置 | 与本项目的关系 |
|---|---|---|
| 自有旧博客 | 原位置 `/Users/nv/proj.xt.com/05Blog`；当前位置 `../vault/raw/05blog/`；用户提供的仓库标识 https://github.com/AustinXT/AustinXT.github.io | 整体移动的只读参考原件，未来选择部分文章重新整理；旧仓库不是新项目 remote |
| 阅读与组织参考 | https://yangzhiping.com | 用户希望类似的参照站；初始化时未核查、未复制素材 |
| 上游品牌协同 | `../../manzi/`；https://github.com/AustinXT/NVoyager | 品牌、选题及渠道协同的输入，不嵌入本项目代码 |
| 下游 | 新博客及其读者；域名与部署目标未确定 | 接收经核验内容与经授权上线的网站 |

完整移动与来源索引证据见 `../docs/research/001_reference-source.md`；文章权利、公开范围和在线站点可用性不因登记而视为已验证。

## 依赖

- 本地初始化验证仅依赖 Python 标准库与 Git；精确 Python 版本唯一锁定于 `../.python-version`。
- 工具清单正本为 `../scripts/check-tools.sh`；脚本存在不等于网站构建通过。
- 最小 CI 为 `../.github/workflows/validate.yml`，只运行初始化规则与回归，不构建或发布新站。
- 网站框架、构建工具版本与部署方式待 research 决定，之后采用生态原生配置与锁定文件。
- 方法入口为 `../skills/README.md`；跨谱系评审状态与授权在状态板，不继承上游模型配置或厂商授权。
