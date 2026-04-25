# 分享页升级参考

本文档用于记录本次对公共分享页 `https://.../shares/:id` 的定制修改，方便后续项目升级时快速比对、回迁和排查。

## 范围

仅覆盖 `packages/server` 中与公共分享页相关的修改。

## 修改文件列表

1. `packages/server/src/utils/joplinUtils.ts`
用途：
分享页笔记渲染逻辑。
修改内容：
为分享页分别渲染 light/dark 两套正文，拆分 renderer 样式与正文 HTML，按主题切换 renderer CSS，并为代码块指定不同的高亮主题，同时向前端传递 light/dark 两套主题相关 plugin assets。

2. `packages/server/src/views/index/items/note.mustache`
用途：
分享页模板。
修改内容：
增加主题切换按钮，使用单一生效的 renderer 样式节点，保留 light/dark 两套正文容器，将更新时间移动到页面底部，并将分享页 logo 链接改为 `https://www.suntao.fr`。

3. `packages/server/public/css/items/note.css`
用途：
分享页样式。
修改内容：
增加浅色/深色主题样式、主题按钮样式、按钮激活态、底部更新时间样式，以及移动端布局优化、代码块换行与紧凑化、表格可读性增强等样式。

4. `packages/server/public/js/items/note.js`
用途：
分享页前端交互逻辑。
修改内容：
增加主题切换、主题记忆、renderer 样式切换，以及代码高亮相关 CSS 资源的按主题切换逻辑。

5. `packages/server/src/routes/index/shares.link.test.ts`
用途：
分享页回归测试。
修改内容：
补充分享页主题按钮和 renderer 主题样式节点的断言。

6. `readme/dev/share_page_ui_changes.md`
用途：
详细设计与实现说明。
修改内容：
记录本次分享页改动的背景、实现过程、最终方案和验证信息。

## 本次功能性改动摘要

本次分享页定制主要实现了以下能力：

1. 公共分享页支持浅色/深色主题切换
2. 主题选择通过 `localStorage` 持久化
3. 代码块会按 light/dark 切换不同的高亮主题
4. 表格、内联代码、代码块在主题切换下更稳定
5. 分享页 logo 仅在该页面跳转到 `https://www.suntao.fr`
6. 更新时间移动到页面底部，并弱化为尾注信息
7. 移动端下导航、代码块、表格的阅读体验得到优化

## 升级时优先检查的关键文件

如果后续升级后分享页出现问题，建议优先检查以下 4 个文件：

1. `packages/server/src/utils/joplinUtils.ts`
2. `packages/server/src/views/index/items/note.mustache`
3. `packages/server/public/css/items/note.css`
4. `packages/server/public/js/items/note.js`

## 备注

本文档保持简洁，仅用于升级参考。

如需查看详细实现背景和完整说明，请同时参考：

1. `readme/dev/share_page_ui_changes.md`
2. `readme/dev/share_page_upgrade_reference.md`
