<div align="center">

# Notes to HTML Pages

[中文](README.md) · **English**

Turn Obsidian Markdown notes into calm, annotated, offline-readable HTML pages for long-form reading.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Obsidian](https://img.shields.io/badge/Obsidian-1.5.0%2B-7c3aed.svg)
![Platform](https://img.shields.io/badge/platform-Desktop-555.svg)
![Version](https://img.shields.io/badge/version-0.5.0-green.svg)

</div>

---

## Overview

**Notes to HTML Pages** is an Obsidian plugin for turning local Markdown notes into clean, self-contained HTML reading pages. It is designed for research, reviews, annual reflections, and other long-form notes that deserve more room to breathe.

Each exported `.html` is standalone: it uses inline CSS and optional embedded local images, so it opens offline in any browser. Exported HTML pages can also be opened directly from the Obsidian file explorer. While reading inside Obsidian, select text to underline it, add a note, and sync that annotation back to the source Markdown note.

**Useful for**

- turning long notes, research documents, and deep reads into calmer reading pages;
- moving through an article with a clickable table of contents;
- marking key passages and keeping reading notes with the original document;
- archiving or sharing a single offline-readable HTML file;
- reading and annotating without leaving Obsidian.

## Preview

![Before and after: Markdown to HTML reading page](assets/before-after-html-page.png)

![Clickable table of contents and readable tables](assets/toc-table-effect.png)

## Features

- **Standalone HTML export**: export the current note or a folder as `.html`. Styling and optional local images are embedded so the page works offline.
- **Long-form reading layout**: narrow text column, serif typography, clear heading hierarchy, introductions, tables, quotes, callouts, conclusion cards, code blocks, and ASCII diagrams.
- **Two levels of navigation**: a clickable table of contents at the beginning of the page, plus a scroll-following section navigator on the left on wide screens.
- **Read HTML inside Obsidian**: exported `.html` files appear in the file explorer and open directly in the app.
- **Selected-text underlines and notes**: select text of any length, including across lines and paragraphs, underline it, and add a reading note.
- **Responsive annotation layout**: on wider screens, notes sit in the right margin beside the relevant passage. On narrower screens, a small note trigger appears at the end of the annotated paragraph and expands inline. Underlines without a note do not create a numbered trigger.
- **Sync annotations back to Markdown**: enabled by default. The quoted text, note, and timestamp are written to the source Markdown note and restored on re-export. When disabled, browser reading still supports temporary marking without changing the source note.
- **Edit and delete annotations**: click a note to edit it. Saving updates the source note; deleting removes the note and its underline from both places.
- **Keep your note structure**: preserve folder hierarchy, convert Wikilinks to same-name HTML links, and embed local images when desired.
- **Source-note backlink**: optionally maintain a clean link to the generated reading page at the top of the source note.
- **Bilingual interface**: commands, context menus, settings, and notices can switch between Chinese and English. The current release is desktop-first.

## Install

### From Obsidian Community Plugins

1. Open Obsidian **Settings** → **Community plugins**.
2. Search for `Notes to HTML Pages`.
3. Install and enable the plugin.

### Manual installation

1. Download `main.js` and `manifest.json` from the latest [Release](https://github.com/afanos/notes-to-html-pages/releases/latest).
2. Create this folder inside your vault:

   ```text
   .obsidian/plugins/notes-to-html-pages/
   ```

3. Place both files in that folder.
4. Restart or reload Obsidian.
5. Enable **Notes to HTML Pages** in Community plugins.

## Use

### Export a reading page

Open a Markdown note and run this command from the command palette:

```text
Notes to HTML Pages: Export current note to HTML page
```

You can also right-click a Markdown file or folder in the file explorer and use the export command. Pages are saved to:

```text
HTML Pages/
```

The settings page lets you change the export folder, folder preservation, Wikilink conversion, image embedding, in-app HTML reading, source-note backlinks, and annotation sync.

### Annotate while reading

1. Open an exported HTML page inside Obsidian.
2. Select a passage and choose **Underline**.
3. Write a note in the compact input that appears with the selection, then save it.
4. On wide screens, the annotation appears in the right margin. On narrow screens, use the small trigger at the end of the marked paragraph.
5. Click an annotation to edit it. Use **Delete** to remove its note and underline.

**Sync annotations back to Markdown** is enabled by default. When it is on, annotations are stored in a plugin-managed block at the end of the source note and restored on the next export. Sync only runs while the HTML page is read inside Obsidian; standalone browser pages remain useful for temporary reading marks.

## Privacy

Conversion, export, HTML reading, and annotation sync all happen locally in your vault. The plugin does not send your notes to an external service.

## Development

```bash
npm install
npm run build
```

The production build writes `main.js` to the repository root.

> **Release note:** Obsidian community releases require the GitHub Release tag to exactly match the version in `manifest.json`, without a `v` prefix. Each release must contain separate `main.js` and `manifest.json` assets. This repository builds, attests, and creates a GitHub Release automatically when a version tag is pushed.

## License

Released under the [MIT License](LICENSE).
