# scripts — 确定性脚本

> 第三组「脚本与扩展」的另一半：**技能是软的，脚本是硬的。**

## 当前入口

| 命令（项目根运行） | 检查 | 不检查 |
|---|---|---|
| `bash scripts/check-tools.sh` | 工具存在、精确 Python 版本 | 不安装；不证明网站栈或账号可用 |
| `python3 -I scripts/check-manifests.py .` | 两份插件清单 | 不安装、打包或外发 |
| `python3 -I scripts/check-system.py` | 初始化文件、方法命名、实体登记、独立 Git 与原件忽略 | 不遍历原件、不判网站构建和人审 |
| `python3 -I scripts/test-check-system.py` | 自建临时夹具上的规则回归 | 不修改实际作品或参考原件 |
| `bash _archive/20261016-reading-delisted/check.sh _archive/20261016-reading-delisted/*.html _archive/20261016-reading-delisted/prototype.css` | 八页与共享样式的字面闸，打印人工清单 | 不判 HTML 结构或人验收 |
| `python3 -I scripts/check-reading-prototype.py` | 指定八页与 CSS、4／6预览上限、全部非空年、数据同源、图标详情及既有护栏 | 不执行页面脚本、不判视觉、手机体验或真实构建 |
| `python3 -I scripts/test-reading-prototype.py` | 实际样本上的内存破坏与临时夹具，含失败退出码 | 不修改样本或参考原件 |

| `python3 -I scripts/check-site-export.py` | 九个固定路由加 `essays/`、`works/` 下全部派生页：可见 DOM、归属、诚实空态、已枚举本地资源与链接；支持随笔、年份、专栏、专题、作品与归档分页；时间线列全部非空年份；年份页每页不超过上限、满页才分页、每篇恰好出现一次；首页速览是最新几篇 | 不执行 JS，不判完整 CSS 绘制、安全审计、正文、人审或线上 |
| `python3 -I scripts/test-site-export.py` | 自建内存突变与目录夹具，含 URL 编码、软链接、资源缺失和 CLI 失败 | 不修改原型或导出产物 |
| `node --test scripts/test-content-loader.mjs` | 正文管线 `src/lib/content.ts` 的 front matter 规则、草稿过滤与「原生 HTML 被丢弃」，每条规则一个反例 | 不读实际正文；需 Node 原生类型剥离与已装依赖 |
| `python3 -I scripts/check-content-export.py` | 每篇非草稿 `.md` 都有导出页；正文在首个 HTML 的脚本之外；源文纯文本行都在正文里；正文不漏 Markdown 标记、不含危险标签；没有草稿或孤儿页 | 不判排版、声音、人审或线上 |
| `python3 -I scripts/test-content-export.py` | 上一条检查器的内存与临时目录反例，含软链接与 CLI 退出码 | 不读实际导出 |
| `python3 -I scripts/check-migration.py` | 已登记的历史旧文在 `docs/research/007_migration-ledger.md` 只登记一次，新写文章无需台账；原件指向 `vault/raw/`；声明「原样」的与原件逐字比对（只允许标题上提一级），原始日期一致 | 原件不在本机（如 CI）时只做登记对账并明说；不判语义、版权或声音 |
| `python3 -I scripts/test-migration.py` | 上一条检查器的内存与临时目录反例，含软链接与 CLI 退出码 | 不读实际台账、正文或原件 |

页面检查器默认模块目录为 `_archive/20261016-reading-delisted/`，可传其他自建夹具目录；旧单 HTML 参数及 `check(text)` 已退休并报错。只读取指定文件，不沿链接读取任意路径；不冻结生产 URL。新工程导出检查默认 `src/out/`，框架资源有限允许，不能拿旧无脚本检查验 Next。旧 URL 的跳转检查要等托管选定后实现；新规则需带反例回归。移动脚本是本次忽略过程材料，不是可无条件重跑的项目命令。

索引纯函数在 `reading-index.py`：接收已解析详情或人工内存记录，返回分类／标签、年份及 HTML 片段，不读路径、不默认覆盖原件。标题、日期与原型分类／标签数组仍只维护在已登记详情；后续生产格式依框架原生约定，不将本 helper 当长期内容系统。

## 完整博客入口

- `sh scripts/verify-blog.sh`：按锁文件重建依赖，检查依赖树、lint、内容与搜索测试、导出反例、迁移台账、构建和类型；完整任务按全局 mac-offload 约定移交。
- `node scripts/test-blog-lifecycle.mjs --snapshot`：只在一次性快照实际构建全部下架、空目录、中文及空格专题分页、25 件作品与生产 SEO，检查草稿不进入所有发布出口，并用真实 HTTP 读取中文路径；finally 恢复内容重建。
- `node scripts/prepare-site.mjs --build`：npm 构建前自动同步 `content/media` 到可再生 `public/media`，清空旧 `out`；原媒体不删除。开发预览使用不带 `--build` 的同一入口。
- `node --test scripts/test-search.mjs`：纯函数的中文/大小写归一、多词匹配、排序与类型过滤。

## 旧博客批量迁入

- `node scripts/migrate-legacy-content.mjs --check-index`：只核对 `content/legacy-index.json` 的唯一来源/目标、文件存在、slug 与上下架字段，不依赖原库；用户后续校对不会被初始正文哈希挡住。
- `node scripts/migrate-legacy-content.mjs --verify-initial`：在保有只读原件的本机核验初次迁入完整、原件 SHA-256 与新迁正文逐字一致、全部草稿。人工开始校对后不再用它要求正文维持初始状态。
- `node scripts/migrate-legacy-content.mjs --map <映射.json> [--write]`：不带 `--write` 只规划；使用 `wx` 创建新正文，已有成品不覆盖。首次迁入已完成，后续无需重跑。已有索引下发现新来源会报错，不静默生成漏登记文章。
- `node --test scripts/test-legacy-migration.mjs`：合成输入测试默认值、正文保留、去重、重复执行、软链接与后续校对，不读取实际旧文。

## 什么该写成脚本

判据只有一条：**这件事能不能用规则判对错？**

| 能规则判 | 写脚本 |
|---|---|
| 命名对不对、格式合不合规、有没有漏字段、链接通不通 | ✅ 脚本，秒级、可重复、不看心情 |
| 写得好不好、这个方案合不合适 | ❌ 留给人，或留给技能 |

**能用规则判的，绝不留给人判。** 每次你手工重复第二遍的检查，都该问一句：能不能是一条命令？

## 怎么长出来

不要预先设计。**踩到一次坑，就把那次的检查固化成一个脚本**——
它的名字应该是那次坑的名字。

## 约定

- **只放这里，不放全局 `bin/`**——全局对整台电脑可见，容易过载，安全风险也高
- 一个脚本干一件事，名字说清干什么
- 能跑就能重复跑：**同样输入同样结果，跑几遍都一样**
- 报告问题，不擅自修改——要改也另出一个 `fix-*` 脚本，让人决定跑不跑
