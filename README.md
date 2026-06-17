# Notes to HTML Pages

Notes to HTML Pages exports Markdown notes into clean, standalone HTML pages that are easy to read offline and can also be opened directly inside Obsidian.

## Features

- Exports the current note or the current folder to `.html`.
- Produces self-contained HTML with inline CSS and no network dependency.
- Uses a restrained reading layout: narrow body, serif typography, clear headings, tables, code blocks, and blockquotes.
- Includes the `简洁` style preset with a compact title area, clickable table of contents, right-side wide-screen navigation, simple numbered entries, red section numbers, and soft quote boxes.
- Preserves folder structure in the export folder by default.
- Converts wiki links toward same-name HTML pages when enabled.
- Embeds local images as data URIs when enabled.
- Registers an in-app HTML reader so exported `.html` files can be opened from the file explorer.
- Optionally inserts a clean backlink at the top of the source note.

## Install Manually

1. Download the release assets:
   - `main.js`
   - `manifest.json`
2. Create this folder inside your vault:

```text
.obsidian/plugins/notes-to-html-pages/
```

3. Put `main.js` and `manifest.json` in that folder.
4. Reload Obsidian.
5. Enable `Notes to HTML Pages` in Community plugins.

## Use

Open a Markdown note and run:

```text
Notes to HTML Pages: 导出当前笔记为 HTML 页面
```

You can also right-click a Markdown file or folder in the file explorer and choose the export command.

By default, exported files are saved to:

```text
HTML Pages/
```

The plugin settings let you change the export folder, style preset, folder structure behavior, wiki-link conversion, image embedding, in-app HTML reading, launcher note generation, and source-note backlink insertion.

## Privacy

All conversion happens locally in your vault. The plugin does not send note content to any external service.

## Development

```bash
npm install
npm run build
```

The production build writes `main.js` to the repository root.

## Release

For Obsidian community releases, the GitHub release tag must exactly match the version in `manifest.json`, without a `v` prefix. The release assets must include `main.js` and `manifest.json` as separate files.

## License

MIT
