# 更新日志 · Changelog

本项目的版本号遵循 `主版本.次版本.修订号`，标签不带 `v` 前缀，与 `manifest.json` 保持一致。
This project uses `MAJOR.MINOR.PATCH` version tags without a `v` prefix, matching `manifest.json`.

## 0.7.0

**中文**

- 新增「自定义正文字体」：在设置中填入电脑里已安装的字体名（例如「霞鹜文楷 / LXGW WenKai」），导出页即用本机字体呈现，无需联网。
- 新增「正文字号」：可在偏小、默认、偏大、特大之间选择导出页的整体阅读字号。
- 新增「一键复制所有划线」：阅读页右下角新增一个与纸面融合的低调按钮，点击即可把本页全部划线原文与备注复制到剪贴板；在 Obsidian 内打开时会自动回退到兼容的复制方式。
- 复制按钮采用当前阅读样式的配色，静止时低调、悬停才显现，尽量不打扰沉浸阅读。

**English**

- Added a **custom body font** setting: enter the name of any font installed on your computer (for example "LXGW WenKai"); exported pages render with that local font and need no network.
- Added a **body text size** setting: choose small, default, large, or extra large for the whole page.
- Added **copy all highlights**: a quiet, paper-matching button in the bottom-right corner copies every highlight (quoted text and notes) to the clipboard, with a clipboard fallback that also works inside Obsidian.
- The copy button uses the active reading style's palette, staying subtle at rest and only standing out on hover so it does not disturb immersive reading.

## 0.6.0

**中文**

- 新增「Claude 风格」阅读样式：杂志大刊式的强排版（大标题、章节编号、引用金句、结论卡片、强排版表格），与原有「简洁」样式并列，可在设置中切换。

**English**

- Added the **Claude** reading style: a magazine-style layout (large headings, section numbers, pull quotes, conclusion cards, strong tables) alongside the existing **Clean** style, selectable in settings.

## 0.5.0

**中文**

- 长文 HTML 阅读页支持选中文本划线与批注，支持跨行、跨段选区；批注默认同步回原 Markdown，可编辑、删除并在重新导出后恢复。

**English**

- Added selected-text underlines and annotations on the HTML reading page, including multi-line and multi-paragraph selections; annotations sync back to the source Markdown by default and can be edited, deleted, and restored on re-export.
