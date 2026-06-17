import MarkdownIt from "markdown-it";
import {
	App,
	FileSystemAdapter,
	FileView,
	MarkdownView,
	Menu,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	TFile,
	TFolder,
	WorkspaceLeaf,
	normalizePath
} from "obsidian";

const VIEW_TYPE_READABLE_HTML = "notes-to-html-pages-html-view";

type HtmlStylePreset = "clean";
type UiLanguage = "zh" | "en";

const HTML_STYLE_OPTIONS: Record<HtmlStylePreset, Record<UiLanguage, string>> = {
	clean: {
		zh: "简洁",
		en: "Clean"
	}
};

const UI_TEXT: Record<UiLanguage, Record<string, string>> = {
	zh: {
		ribbonExportCurrentNote: "导出当前笔记为 HTML 页面",
		commandExportCurrentNote: "导出当前笔记为 HTML 页面",
		commandExportCurrentFolder: "导出当前文件夹为 HTML 页面",
		menuExportNote: "导出为 HTML 页面",
		menuExportFolder: "导出文件夹为 HTML 页面",
		noticeNoActiveMarkdown: "当前没有打开 Markdown 笔记。",
		noticeNoMarkdownInFolder: "这个文件夹里没有可导出的 Markdown 笔记。",
		noticeFolderExported: "已导出 {count} 篇笔记为 HTML 页面。",
		noticeFileExported: "已导出：{path}",
		noticeExportFailed: "导出失败：{path}",
		noticeReloadRequired: "重启 Obsidian 或重新加载插件后，命令名和侧边栏按钮会更新。",
		untitledSection: "未命名章节",
		toc: "目录",
		sectionTocAria: "章节目录",
		codeLabel: "代码",
		asciiFigureLabel: "ASCII 图",
		fallbackHtmlPage: "HTML 页面",
		launcherOpenInBrowser: "在浏览器打开 HTML 页面",
		launcherHtmlFile: "HTML 文件",
		launcherSourceNote: "源笔记",
		sourceLinkLabel: "HTML 页面",
		sourceLinkAlias: "打开 HTML 页面",
		settingsTitle: "Notes to HTML Pages",
		settingLanguageName: "界面语言",
		settingLanguageDesc: "切换插件命令、右键菜单、设置页和提示文案。命令名需要重载插件后刷新。",
		languageChinese: "中文",
		languageEnglish: "English",
		settingExportFolderName: "导出目录",
		settingExportFolderDesc: "相对于当前 vault 根目录。",
		settingStyleName: "HTML 样式",
		settingStyleDesc: "控制导出的 HTML 页面版式。后续新增样式会出现在这里。",
		settingPreserveFoldersName: "保留原文件夹层级",
		settingPreserveFoldersDesc: "开启后，导出的 HTML 会在导出目录里复刻原笔记的文件夹路径。",
		settingAddTitleName: "没有 H1 时用文件名补标题",
		settingAddTitleDesc: "让导出的页面始终有一个居中的主标题。",
		settingWikilinksName: "将 Wikilink 指向同名 HTML",
		settingWikilinksDesc: "例如 [[长文]] 会导出为指向 长文.html 的链接。",
		settingOpenHtmlName: "在 Obsidian 内直接打开 HTML",
		settingOpenHtmlDesc: "注册 .html/.htm 文件视图。开启后，导出的 HTML 会出现在文件列表中，并可直接点开阅读。",
		settingLauncherName: "生成 Obsidian 可见入口笔记",
		settingLauncherDesc: "兼容旧方案：同时生成同名 .md 入口笔记。已开启 HTML 直接阅读时通常不需要。",
		settingInsertLinkName: "在原文开头插入阅读版双链",
		settingInsertLinkDesc: "导出后，在原文开头放入指向入口笔记的双链。再次导出会自动更新，不会重复添加。",
		settingEmbedImagesName: "内嵌本地图片",
		settingEmbedImagesDesc: "把本地图片转为 data URI，方便 HTML 文件独立打开。"
	},
	en: {
		ribbonExportCurrentNote: "Export current note to HTML page",
		commandExportCurrentNote: "Export current note to HTML page",
		commandExportCurrentFolder: "Export current folder to HTML pages",
		menuExportNote: "Export to HTML page",
		menuExportFolder: "Export folder to HTML pages",
		noticeNoActiveMarkdown: "No Markdown note is currently open.",
		noticeNoMarkdownInFolder: "This folder does not contain Markdown notes to export.",
		noticeFolderExported: "Exported {count} notes to HTML pages.",
		noticeFileExported: "Exported: {path}",
		noticeExportFailed: "Export failed: {path}",
		noticeReloadRequired: "Reload Obsidian or reload the plugin to refresh command names and the ribbon button.",
		untitledSection: "Untitled section",
		toc: "Table of contents",
		sectionTocAria: "Section table of contents",
		codeLabel: "Code",
		asciiFigureLabel: "ASCII diagram",
		fallbackHtmlPage: "HTML Page",
		launcherOpenInBrowser: "Open HTML page in browser",
		launcherHtmlFile: "HTML file",
		launcherSourceNote: "Source note",
		sourceLinkLabel: "HTML Page",
		sourceLinkAlias: "Open HTML Page",
		settingsTitle: "Notes to HTML Pages",
		settingLanguageName: "Interface language",
		settingLanguageDesc: "Switch plugin commands, context menus, settings, and notices. Command names refresh after reloading the plugin.",
		languageChinese: "中文",
		languageEnglish: "English",
		settingExportFolderName: "Export folder",
		settingExportFolderDesc: "Relative to the current vault root.",
		settingStyleName: "HTML style",
		settingStyleDesc: "Controls the exported HTML page layout. Future styles will appear here.",
		settingPreserveFoldersName: "Preserve folder structure",
		settingPreserveFoldersDesc: "Exports HTML pages into matching subfolders inside the export folder.",
		settingAddTitleName: "Use filename as title when H1 is missing",
		settingAddTitleDesc: "Ensures every exported page has a centered main title.",
		settingWikilinksName: "Point Wikilinks to same-name HTML",
		settingWikilinksDesc: "For example, [[Long note]] will link to Long note.html.",
		settingOpenHtmlName: "Open HTML directly in Obsidian",
		settingOpenHtmlDesc: "Registers a .html/.htm file view so exported HTML files appear in the file explorer and open inside Obsidian.",
		settingLauncherName: "Create Obsidian-visible launcher notes",
		settingLauncherDesc: "Legacy compatibility: also create a same-name .md launcher note. Usually unnecessary when direct HTML reading is enabled.",
		settingInsertLinkName: "Insert HTML backlink at source note top",
		settingInsertLinkDesc: "After export, insert a backlink to the generated reading page at the top of the source note. Re-exporting updates it without duplicates.",
		settingEmbedImagesName: "Embed local images",
		settingEmbedImagesDesc: "Converts local images to data URIs so the HTML file can be opened standalone."
	}
};

interface ReadableHtmlSettings {
	interfaceLanguage: UiLanguage;
	exportFolder: string;
	stylePreset: HtmlStylePreset;
	preserveFolderStructure: boolean;
	addTitleFromFilename: boolean;
	linkWikilinksToHtml: boolean;
	embedLocalImages: boolean;
	openHtmlInObsidian: boolean;
	createLauncherNote: boolean;
	insertLinkInSource: boolean;
}

const DEFAULT_SETTINGS: ReadableHtmlSettings = {
	interfaceLanguage: "zh",
	exportFolder: "HTML Pages",
	stylePreset: "clean",
	preserveFolderStructure: true,
	addTitleFromFilename: true,
	linkWikilinksToHtml: true,
	embedLocalImages: true,
	openHtmlInObsidian: true,
	createLauncherNote: false,
	insertLinkInSource: true
};

const SOURCE_LINK_BLOCK_REGEX =
	/(?:%% readable-html-exporter-link:start %%\r?\n)?^> (?:阅读版 HTML|HTML 页面|Readable HTML|HTML Page)\s*[：:]\s*\[\[[^\]]+\|(?:打开对应 HTML|打开 HTML 页面|Open HTML|Open HTML Page)\]\]\s*\r?\n(?:%% readable-html-exporter-link:end %%\r?\n?)?/gm;

interface ExportPaths {
	htmlPath: string;
	launcherPath: string;
	outputFolder: string;
	htmlFileName: string;
	htmlWikiTarget: string;
	launcherWikiTarget: string;
}

export default class ReadableHtmlExporterPlugin extends Plugin {
	settings: ReadableHtmlSettings = DEFAULT_SETTINGS;
	private markdown!: MarkdownIt;

	async onload(): Promise<void> {
		await this.loadSettings();
		this.markdown = this.createMarkdownRenderer();

		if (this.settings.openHtmlInObsidian) {
			this.registerView(VIEW_TYPE_READABLE_HTML, (leaf) => new ReadableHtmlView(leaf));

			try {
				this.registerExtensions(["html", "htm"], VIEW_TYPE_READABLE_HTML);
			} catch (error) {
				console.info("Notes to HTML Pages could not register html/htm extensions.", error);
			}
		}

		this.addRibbonIcon("file-output", this.t("ribbonExportCurrentNote"), () => {
			void this.exportActiveFile();
		});

		this.addCommand({
			id: "export-current-note-readable-html",
			name: this.t("commandExportCurrentNote"),
			checkCallback: (checking) => {
				const file = this.getActiveMarkdownFile();
				if (!file) return false;

				if (!checking) {
					void this.exportFile(file, true);
				}
				return true;
			}
		});

		this.addCommand({
			id: "export-current-folder-readable-html",
			name: this.t("commandExportCurrentFolder"),
			checkCallback: (checking) => {
				const file = this.getActiveMarkdownFile();
				const folder = file?.parent;
				if (!folder) return false;

				if (!checking) {
					void this.exportFolder(folder);
				}
				return true;
			}
		});

		this.registerEvent(
			this.app.workspace.on("file-menu", (menu: Menu, file) => {
				if (file instanceof TFile && file.extension === "md") {
					menu.addItem((item) => {
						item
							.setTitle(this.t("menuExportNote"))
							.setIcon("file-output")
							.onClick(() => void this.exportFile(file, true));
					});
				}

				if (file instanceof TFolder) {
					menu.addItem((item) => {
						item
							.setTitle(this.t("menuExportFolder"))
							.setIcon("folder-output")
							.onClick(() => void this.exportFolder(file));
					});
				}
			})
		);

		this.addSettingTab(new ReadableHtmlSettingTab(this.app, this));
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	getInterfaceLanguage(): UiLanguage {
		return this.settings.interfaceLanguage === "en" ? "en" : "zh";
	}

	t(key: keyof typeof UI_TEXT.zh, vars: Record<string, string | number> = {}): string {
		const language = this.getInterfaceLanguage();
		const template = UI_TEXT[language][key] ?? UI_TEXT.zh[key] ?? key;
		return template.replace(/\{(\w+)}/g, (_, name: string) => String(vars[name] ?? ""));
	}

	tForLanguage(
		language: UiLanguage,
		key: keyof typeof UI_TEXT.zh,
		vars: Record<string, string | number> = {}
	): string {
		const template = UI_TEXT[language][key] ?? UI_TEXT.zh[key] ?? key;
		return template.replace(/\{(\w+)}/g, (_, name: string) => String(vars[name] ?? ""));
	}

	getStyleLabel(stylePreset: HtmlStylePreset, language = this.getInterfaceLanguage()): string {
		return HTML_STYLE_OPTIONS[stylePreset]?.[language] ?? stylePreset;
	}

	private createMarkdownRenderer(): MarkdownIt {
		const md = new MarkdownIt({
			html: true,
			linkify: false,
			typographer: false,
			breaks: false
		});

		const defaultHeadingOpen =
			md.renderer.rules.heading_open ??
			((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));

		md.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
			const token = tokens[idx];
			const nextToken = tokens[idx + 1];

			if (nextToken?.type === "inline" && nextToken.content) {
				const headingIds = this.getHeadingIdMap(env);
				const baseId = this.slugify(nextToken.content);
				const usedCount = headingIds.get(baseId) ?? 0;
				headingIds.set(baseId, usedCount + 1);
				token.attrSet("id", usedCount === 0 ? baseId : `${baseId}-${usedCount + 1}`);
			}

			return defaultHeadingOpen(tokens, idx, options, env, self);
		};

		return md;
	}

	private getHeadingIdMap(env: unknown): Map<string, number> {
		const renderEnv = env as { headingIds?: Map<string, number> };
		if (!renderEnv.headingIds) {
			renderEnv.headingIds = new Map<string, number>();
		}
		return renderEnv.headingIds;
	}

	private getActiveMarkdownFile(): TFile | null {
		const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
		const file = markdownView?.file ?? this.app.workspace.getActiveFile();

		if (file instanceof TFile && file.extension === "md") {
			return file;
		}
		return null;
	}

	private async exportActiveFile(): Promise<void> {
		const file = this.getActiveMarkdownFile();
		if (!file) {
			new Notice(this.t("noticeNoActiveMarkdown"));
			return;
		}

		await this.exportFile(file, true);
	}

	private async exportFolder(folder: TFolder): Promise<void> {
		const files = this.collectMarkdownFiles(folder).filter(
			(file) => !this.isInsideExportFolder(file.path)
		);

		if (files.length === 0) {
			new Notice(this.t("noticeNoMarkdownInFolder"));
			return;
		}

		let successCount = 0;
		for (const file of files) {
			await this.exportFile(file, false);
			successCount += 1;
		}

			new Notice(this.t("noticeFolderExported", { count: successCount }));
	}

	private collectMarkdownFiles(folder: TFolder): TFile[] {
		const files: TFile[] = [];

		for (const child of folder.children) {
			if (child instanceof TFile && child.extension === "md") {
				files.push(child);
			}

			if (child instanceof TFolder) {
				files.push(...this.collectMarkdownFiles(child));
			}
		}

		return files;
	}

	private async exportFile(file: TFile, showNotice: boolean): Promise<void> {
		try {
			const paths = this.getOutputPaths(file);
			const { html, title } = await this.renderFileToHtml(file);

			await this.ensureFolder(paths.outputFolder);
			await this.writeTextFile(paths.htmlPath, html);

			if (this.settings.createLauncherNote) {
				await this.writeTextFile(paths.launcherPath, this.createLauncherNote(file, title, paths));
			}

			if (this.settings.insertLinkInSource) {
				const sourceLinkTarget = this.settings.openHtmlInObsidian
					? paths.htmlWikiTarget
					: paths.launcherWikiTarget;
				await this.upsertSourceLink(file, sourceLinkTarget);
			}

			if (showNotice) {
				new Notice(this.t("noticeFileExported", { path: paths.htmlPath }));
			}
		} catch (error) {
			console.error(error);
			new Notice(this.t("noticeExportFailed", { path: file.path }));
		}
	}

	private async renderFileToHtml(file: TFile): Promise<{ html: string; title: string }> {
		const raw = await this.app.vault.cachedRead(file);
		const { content, frontmatterTitle } = this.stripFrontmatter(raw);
		const contentWithoutSourceLink = this.removeSourceLinkBlock(content);
		const prepared = await this.prepareMarkdown(contentWithoutSourceLink, file);
		const title = this.findFirstHeading(contentWithoutSourceLink) ?? frontmatterTitle ?? file.basename;
		const shouldAddTitle =
			this.settings.addTitleFromFilename && !this.hasTopLevelHeading(prepared);
		const markdown = shouldAddTitle ? `# ${title}\n\n${prepared}` : prepared;
		const stylePreset = this.getStylePreset();
		const renderedBody = this.markdown.render(markdown, {});
		const documentLanguage: UiLanguage = /[\u3400-\u9fff]/.test(raw) ? "zh" : "en";
		const body = this.buildStyledBody(renderedBody, title, stylePreset, documentLanguage);
		const lang = documentLanguage === "zh" ? "zh-CN" : "en";

		return {
			title,
			html: [
			"<!doctype html>",
			`<html lang="${lang}">`,
			"<head>",
			'<meta charset="utf-8">',
			'<meta name="viewport" content="width=device-width, initial-scale=1">',
			`<meta name="notes-to-html-pages-style" content="${stylePreset}">`,
			`<title>${this.escapeHtml(title)}</title>`,
			`<style>${this.getStyleCss(stylePreset)}</style>`,
			"</head>",
			`<body class="style-${stylePreset}">`,
			'<main class="page">',
			body,
			"</main>",
			"</body>",
			"</html>"
			].join("\n")
		};
	}

	private getStylePreset(): HtmlStylePreset {
		return Object.prototype.hasOwnProperty.call(HTML_STYLE_OPTIONS, this.settings.stylePreset)
			? this.settings.stylePreset
			: "clean";
	}

	private getStyleCss(stylePreset: HtmlStylePreset): string {
		if (stylePreset === "clean") {
			return CLEAN_HTML_CSS;
		}
		return CLEAN_HTML_CSS;
	}

	private buildStyledBody(
		renderedHtml: string,
		fallbackTitle: string,
		stylePreset: HtmlStylePreset,
		documentLanguage: UiLanguage
	): string {
		if (stylePreset !== "clean" || typeof DOMParser === "undefined") {
			return `<article class="article-body">${renderedHtml}</article>`;
		}

		const document = new DOMParser().parseFromString(`<main>${renderedHtml}</main>`, "text/html");
		const wrapper = document.querySelector("main");
		if (!wrapper) {
			return `<article class="article-body">${renderedHtml}</article>`;
		}

		const firstHeading = wrapper.querySelector("h1");
		const title = firstHeading?.textContent?.trim() || fallbackTitle;
		firstHeading?.remove();

		let deckHtml = "";
		const firstElement = this.getFirstContentElement(wrapper);
		if (firstElement?.tagName === "BLOCKQUOTE") {
			deckHtml = firstElement.innerHTML;
			firstElement.remove();
		}

		this.removeLeadingHr(wrapper);
		this.removeLeadingManualToc(wrapper);
		this.normalizeSectionHeadings(wrapper);
		this.enhanceReadableBlocks(wrapper, documentLanguage);
		const toc = this.createAutoToc(wrapper, documentLanguage);

		return [
			this.createArticleHero(title, deckHtml),
			toc,
			`<article class="article-body">${wrapper.innerHTML}</article>`
		]
			.filter(Boolean)
			.join("\n");
	}

	private createArticleHero(title: string, deckHtml: string): string {
		const { primary, secondary } = this.splitHeroTitle(title);
		const deck = deckHtml ? `<div class="article-deck">${deckHtml}</div>` : "";

		return [
			'<header class="article-hero">',
			`<h1><span>${this.escapeHtml(primary)}</span>${secondary ? `<span>${this.escapeHtml(secondary)}</span>` : ""}</h1>`,
			deck,
			'<div class="hero-rule" aria-hidden="true"></div>',
			"</header>"
		].join("\n");
	}

	private splitHeroTitle(title: string): { primary: string; secondary: string | null } {
		const parts = title
			.split(/\s+[·|｜]\s+|\s*[·|｜]\s*/u)
			.map((part) => part.trim())
			.filter(Boolean);

		if (parts.length >= 2 && title.length <= 80) {
			return {
				primary: parts[0],
				secondary: parts.slice(1).join(" · ")
			};
		}

		return { primary: title, secondary: null };
	}

	private createAutoToc(wrapper: Element, documentLanguage: UiLanguage): string {
		const headings = Array.from(wrapper.querySelectorAll("h2")).filter(
			(heading) => !this.isTocHeading(heading)
		);

		if (headings.length < 2) {
			return "";
		}

		const usedIds = new Map<string, number>();
		const items = headings.map((heading) => {
			const text =
				heading.textContent?.trim() ||
				this.tForLanguage(documentLanguage, "untitledSection");
			const existingId = heading.getAttribute("id");
			const id = existingId || this.createUniqueHeadingId(text, usedIds);
			heading.setAttribute("id", id);

			return `<li><a href="#${this.escapeHtml(id)}">${this.escapeHtml(
				this.cleanTocLabel(text)
			)}</a></li>`;
		});

		const tocLabel = this.tForLanguage(documentLanguage, "toc");
		const sectionTocLabel = this.tForLanguage(documentLanguage, "sectionTocAria");

		return [
			`<nav class="table-of-contents" aria-label="${this.escapeHtml(tocLabel)}">`,
			`<h2>${this.escapeHtml(tocLabel)}</h2>`,
			"<ol>",
			items.join("\n"),
			"</ol>",
			"</nav>",
			`<aside class="side-table-of-contents" aria-label="${this.escapeHtml(sectionTocLabel)}">`,
			`<div class="side-toc-title">${this.escapeHtml(tocLabel)}</div>`,
			"<ol>",
			items.join("\n"),
			"</ol>",
			"</aside>"
		].join("\n");
	}

	private removeLeadingManualToc(wrapper: Element): void {
		const firstElement = this.getFirstContentElement(wrapper);
		if (!firstElement || !this.isTocHeading(firstElement)) {
			return;
		}

		let next = firstElement.nextElementSibling;
		firstElement.remove();

		while (next && !/^H[12]$/.test(next.tagName)) {
			const current = next;
			next = next.nextElementSibling;
			current.remove();
		}
	}

	private removeLeadingHr(wrapper: Element): void {
		const firstElement = this.getFirstContentElement(wrapper);
		if (firstElement?.tagName === "HR") {
			firstElement.remove();
		}
	}

	private normalizeSectionHeadings(wrapper: Element): void {
		Array.from(wrapper.querySelectorAll("h2")).forEach((heading) => {
			if (this.isTocHeading(heading)) {
				return;
			}

			const text = heading.textContent?.trim() ?? "";
			const cleanText = this.cleanSectionPrefix(text);
			if (cleanText && cleanText !== text) {
				heading.textContent = cleanText;
			}
		});
	}

	private enhanceReadableBlocks(wrapper: Element, documentLanguage: UiLanguage): void {
		this.enhanceBlockquotes(wrapper);
		this.enhanceCodeFigures(wrapper, documentLanguage);
		this.enhanceTables(wrapper);
	}

	private enhanceBlockquotes(wrapper: Element): void {
		Array.from(wrapper.querySelectorAll("blockquote")).forEach((blockquote) => {
			const label = this.getBlockquoteLabel(blockquote);
			const text = blockquote.textContent?.trim() ?? "";
			const kind = this.getBlockquoteKind(label, text);

			blockquote.classList.add("readable-blockquote");
			if (label) {
				blockquote.setAttribute("data-label", label);
			}

			if (kind === "conclusion") {
				blockquote.classList.add("callout-block", "callout-conclusion");
			} else if (kind === "highlight") {
				blockquote.classList.add("callout-block", "callout-highlight");
			} else {
				blockquote.classList.add("quote-block");
			}
		});
	}

	private getBlockquoteLabel(blockquote: Element): string {
		const firstStrong =
			blockquote.querySelector("p:first-child strong:first-child") ??
			blockquote.querySelector("strong:first-child");
		return firstStrong?.textContent?.trim() ?? "";
	}

	private getBlockquoteKind(label: string, text: string): "quote" | "highlight" | "conclusion" {
		const signature = `${label} ${text.slice(0, 80)}`.toLowerCase();
		if (/(结论|总结|小结|结语|最终判断|takeaway|conclusion|summary|final)/i.test(signature)) {
			return "conclusion";
		}

		if (
			/(重点|要点|提示|注意|关键|核心|观察|洞察|提醒|important|note|tip|warning|info|insight)/i.test(
				signature
			)
		) {
			return "highlight";
		}

		return "quote";
	}

	private enhanceCodeFigures(wrapper: Element, documentLanguage: UiLanguage): void {
		Array.from(wrapper.querySelectorAll("pre")).forEach((pre) => {
			const text = pre.textContent ?? "";
			const isAsciiFigure = this.looksLikeAsciiFigure(text);
			pre.classList.add("code-figure");
			if (isAsciiFigure) {
				pre.classList.add("ascii-figure");
			}
			pre.setAttribute(
				"data-label",
				isAsciiFigure
					? this.tForLanguage(documentLanguage, "asciiFigureLabel")
					: this.tForLanguage(documentLanguage, "codeLabel")
			);
		});
	}

	private enhanceTables(wrapper: Element): void {
		Array.from(wrapper.querySelectorAll("table")).forEach((table) => {
			if (table.parentElement?.classList.contains("table-scroll")) {
				return;
			}

			const tableScroll = table.ownerDocument.createElement("div");
			tableScroll.className = "table-scroll";
			table.replaceWith(tableScroll);
			tableScroll.appendChild(table);
		});
	}

	private looksLikeAsciiFigure(text: string): boolean {
		const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
		if (lines.length < 3) {
			return false;
		}

		return /[┌┐└┘├┤┬┴┼│─━┃╭╮╰╯→←↑↓▼▲]|(?:-{2,}>|={2,}>|\|[\s\S]*\||\+-{2,}\+)/.test(
			text
		);
	}

	private getFirstContentElement(wrapper: Element): Element | null {
		return (
			Array.from(wrapper.children).find(
				(child) => child.tagName === "HR" || Boolean(child.textContent?.trim())
			) ?? null
		);
	}

	private isTocHeading(element: Element): boolean {
		return /^H[1-6]$/.test(element.tagName) && /^目录|toc$/i.test(element.textContent?.trim() ?? "");
	}

	private createUniqueHeadingId(text: string, usedIds: Map<string, number>): string {
		const baseId = this.slugify(text);
		const usedCount = usedIds.get(baseId) ?? 0;
		usedIds.set(baseId, usedCount + 1);
		return usedCount === 0 ? baseId : `${baseId}-${usedCount + 1}`;
	}

	private cleanTocLabel(text: string): string {
		return this.cleanSectionPrefix(text);
	}

	private cleanSectionPrefix(text: string): string {
		return (
			text
				.replace(
					/^(?:第[一二三四五六七八九十百千万\d]+[层章节部分篇讲课节讲]*|[一二三四五六七八九十百千万]+|[0-9]{1,2})[：:、.．\s-]+/u,
					""
				)
				.trim() || text
		);
	}

	private stripFrontmatter(raw: string): { content: string; frontmatterTitle: string | null } {
		const match = raw.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/);
		if (!match) {
			return { content: raw, frontmatterTitle: null };
		}

		const frontmatter = match[1];
		const titleMatch = frontmatter.match(/^title:\s*["']?(.+?)["']?\s*$/m);

		return {
			content: raw.slice(match[0].length),
			frontmatterTitle: titleMatch ? titleMatch[1].trim() : null
		};
	}

	private async prepareMarkdown(markdown: string, sourceFile: TFile): Promise<string> {
		const withoutComments = markdown.replace(/%%[\s\S]*?%%/g, "");

		return this.transformOutsideFences(withoutComments, async (line) => {
			let transformed = this.convertCalloutMarker(line);
			transformed = await this.convertObsidianEmbeds(transformed, sourceFile);
			transformed = await this.convertMarkdownImages(transformed, sourceFile);
			transformed = this.convertWikilinks(transformed);
			return transformed;
		});
	}

	private async transformOutsideFences(
		markdown: string,
		transform: (line: string) => Promise<string>
	): Promise<string> {
		const lines = markdown.split(/\r?\n/);
		const output: string[] = [];
		let inFence = false;
		let fenceChar: "`" | "~" | null = null;
		let fenceLength = 0;

		for (const line of lines) {
			const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);
			if (fenceMatch) {
				const marker = fenceMatch[1];
				const markerChar = marker[0] as "`" | "~";

				if (!inFence) {
					inFence = true;
					fenceChar = markerChar;
					fenceLength = marker.length;
				} else if (fenceChar === markerChar && marker.length >= fenceLength) {
					inFence = false;
					fenceChar = null;
					fenceLength = 0;
				}

				output.push(line);
				continue;
			}

			output.push(inFence ? line : await transform(line));
		}

		return output.join("\n");
	}

	private convertCalloutMarker(line: string): string {
		return line.replace(
			/^(\s*>+\s*)\[!([^\]]+)\][+-]?\s*(.*)$/i,
			(_match, prefix: string, type: string, title: string) => {
				const label = title.trim() || this.titleCase(type.replace(/[-_]/g, " "));
				return `${prefix}**${this.escapeMarkdownText(label)}**`;
			}
		);
	}

	private async convertObsidianEmbeds(line: string, sourceFile: TFile): Promise<string> {
		return this.replaceAsync(line, /!\[\[([^\]]+)]]/g, async (_match, inner: string) => {
			const { target, alias } = this.parseObsidianLink(inner);
			const linkedFile = this.resolveLinkedFile(target, sourceFile);
			const label = alias || target;

			if (linkedFile && this.isImageFile(linkedFile)) {
				const src = this.settings.embedLocalImages
					? await this.fileToDataUri(linkedFile)
					: this.getRelativePath(sourceFile.path, linkedFile.path);
				return `![${this.escapeMarkdownText(label)}](${src})`;
			}

			if (linkedFile && linkedFile.extension === "md") {
				return `[${this.escapeMarkdownText(label)}](${this.obsidianTargetToHtmlHref(target)})`;
			}

			return `**${this.escapeMarkdownText(label)}**`;
		});
	}

	private async convertMarkdownImages(line: string, sourceFile: TFile): Promise<string> {
		if (!this.settings.embedLocalImages) {
			return line;
		}

		return this.replaceAsync(
			line,
			/!\[([^\]]*)]\(([^)\s]+)\)/g,
			async (match, alt: string, src: string) => {
				if (this.isRemoteOrDataUri(src)) {
					return match;
				}

				const cleanSrc = src.replace(/^<|>$/g, "");
				const linkedFile = this.resolveLinkedFile(decodeURIComponent(cleanSrc), sourceFile);
				if (!linkedFile || !this.isImageFile(linkedFile)) {
					return match;
				}

				const dataUri = await this.fileToDataUri(linkedFile);
				return `![${this.escapeMarkdownText(alt)}](${dataUri})`;
			}
		);
	}

	private convertWikilinks(line: string): string {
		return line.replace(/(^|[^!])\[\[([^\]]+)]]/g, (_match, prefix: string, inner: string) => {
			const { target, alias } = this.parseObsidianLink(inner);
			const displayText = alias || this.getDisplayTextFromTarget(target);

			if (!this.settings.linkWikilinksToHtml) {
				return `${prefix}${this.escapeMarkdownText(displayText)}`;
			}

			return `${prefix}[${this.escapeMarkdownText(displayText)}](${this.obsidianTargetToHtmlHref(
				target
			)})`;
		});
	}

	private parseObsidianLink(inner: string): { target: string; alias: string | null } {
		const [target, ...aliasParts] = inner.split("|");
		const alias = aliasParts.length > 0 ? aliasParts.join("|").trim() : null;

		return {
			target: target.trim(),
			alias
		};
	}

	private resolveLinkedFile(target: string, sourceFile: TFile): TFile | null {
		const linkPath = target.split("#")[0].split("^")[0].trim();
		if (!linkPath) return null;

		const linkedFile = this.app.metadataCache.getFirstLinkpathDest(linkPath, sourceFile.path);
		return linkedFile instanceof TFile ? linkedFile : null;
	}

	private obsidianTargetToHtmlHref(target: string): string {
		const [pathAndMaybeBlock, heading] = target.split("#");
		const pathWithoutBlock = pathAndMaybeBlock.split("^")[0].trim();
		const headingWithoutBlock = heading?.split("^")[0].trim();
		const htmlPath = pathWithoutBlock
			? pathWithoutBlock.replace(/\.md$/i, "") + ".html"
			: "";
		const hash = headingWithoutBlock ? `#${this.slugify(headingWithoutBlock)}` : "";

		return `${encodeURI(htmlPath)}${hash}`;
	}

	private getDisplayTextFromTarget(target: string): string {
		const withoutBlock = target.split("^")[0];
		const heading = withoutBlock.split("#")[1];
		const path = withoutBlock.split("#")[0];
		const basename = path.split("/").pop()?.replace(/\.md$/i, "") || target;

		return heading?.trim() || basename.trim();
	}

	private getOutputPaths(file: TFile): ExportPaths {
		const htmlPath = this.getOutputPath(file, "html");
		const launcherPath = this.getOutputPath(file, "md");
		const outputFolder = htmlPath.substring(0, htmlPath.lastIndexOf("/"));

		return {
			htmlPath,
			launcherPath,
			outputFolder,
			htmlFileName: htmlPath.split("/").pop() ?? `${this.cleanFileName(file.basename)}.html`,
			htmlWikiTarget: htmlPath,
			launcherWikiTarget: launcherPath.replace(/\.md$/i, "")
		};
	}

	private getOutputPath(file: TFile, extension: "html" | "md"): string {
		const exportFolder = this.cleanVaultPath(this.settings.exportFolder || "HTML Pages");
		const sourceFolder =
			this.settings.preserveFolderStructure && file.parent?.path ? file.parent.path : "";
		const fileName = `${this.cleanFileName(file.basename)}.${extension}`;

		return normalizePath([exportFolder, sourceFolder, fileName].filter(Boolean).join("/"));
	}

	private isInsideExportFolder(path: string): boolean {
		const exportFolder = this.cleanVaultPath(this.settings.exportFolder || "HTML Pages");
		return path === exportFolder || path.startsWith(`${exportFolder}/`);
	}

	private cleanVaultPath(path: string): string {
		return normalizePath(path.trim().replace(/^\/+|\/+$/g, ""));
	}

	private cleanFileName(fileName: string): string {
		return fileName.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-").trim() || "untitled";
	}

	private async ensureFolder(folderPath: string): Promise<void> {
		const cleanPath = this.cleanVaultPath(folderPath);
		if (!cleanPath) return;

		const parts = cleanPath.split("/");
		let current = "";

		for (const part of parts) {
			current = current ? `${current}/${part}` : part;
			if (!(await this.app.vault.adapter.exists(current))) {
				await this.app.vault.adapter.mkdir(current);
			}
		}
	}

	private async writeTextFile(path: string, content: string): Promise<void> {
		const existing = this.app.vault.getAbstractFileByPath(path);

		if (existing instanceof TFile) {
			await this.app.vault.modify(existing, content);
			return;
		}

		if (await this.app.vault.adapter.exists(path)) {
			await this.app.vault.adapter.write(path, content);
			return;
		}

		if (path.endsWith(".md")) {
			await this.app.vault.create(path, content);
			return;
		}

		await this.app.vault.adapter.write(path, content);
	}

	private createLauncherNote(file: TFile, title: string, paths: ExportPaths): string {
		const sourceTarget = file.path.replace(/\.md$/i, "");
		const htmlUri = this.getFileUri(paths.htmlPath) ?? encodeURI(paths.htmlFileName);
		const now = new Date().toISOString();

		return [
			"---",
			"readable_html_exporter: true",
			`source: "${this.escapeYamlValue(file.path)}"`,
			`html: "${this.escapeYamlValue(paths.htmlPath)}"`,
			`updated: "${now}"`,
			"---",
			"",
			`# ${this.escapeMarkdownHeading(title)}`,
			"",
			`[${this.t("launcherOpenInBrowser")}](${htmlUri})`,
			"",
			`${this.t("launcherHtmlFile")}：\`${paths.htmlFileName}\``,
			"",
			`${this.t("launcherSourceNote")}：[[${sourceTarget}|${this.escapeMarkdownText(file.basename)}]]`
		].join("\n");
	}

	private async upsertSourceLink(file: TFile, launcherWikiTarget: string): Promise<void> {
		const raw = await this.app.vault.read(file);
		const withoutOldLink = this.removeSourceLinkBlock(raw);
		const linkBlock = `> ${this.t("sourceLinkLabel")}: [[${launcherWikiTarget}|${this.t(
			"sourceLinkAlias"
		)}]]`;
		const updated = this.insertAfterFrontmatter(withoutOldLink, linkBlock);

		if (updated !== raw) {
			await this.app.vault.modify(file, updated);
		}
	}

	private removeSourceLinkBlock(markdown: string): string {
		return markdown.replace(SOURCE_LINK_BLOCK_REGEX, "");
	}

	private insertAfterFrontmatter(markdown: string, block: string): string {
		const insertion = `${block}\n\n`;
		const frontmatter = markdown.match(/^---\s*\r?\n[\s\S]*?\r?\n---\s*(?:\r?\n|$)/);

		if (!frontmatter) {
			return `${insertion}${markdown.replace(/^\s*\n/, "")}`;
		}

		const frontmatterText = frontmatter[0].replace(/\s*$/, "\n");
		const rest = markdown.slice(frontmatter[0].length).replace(/^\s*\n/, "");

		return `${frontmatterText}${insertion}${rest}`;
	}

	private getFileUri(vaultPath: string): string | null {
		if (!(this.app.vault.adapter instanceof FileSystemAdapter)) {
			return null;
		}

		const basePath = normalizePath(this.app.vault.adapter.getBasePath());
		const absolutePath = normalizePath(`${basePath}/${vaultPath}`);
		const normalized = absolutePath.replace(/\\/g, "/");
		const encoded = normalized
			.split("/")
			.map((part) => encodeURIComponent(part))
			.join("/")
			.replace(/^([A-Za-z])%3A/, "$1:");

		return /^[A-Za-z]:\//.test(normalized) ? `file:///${encoded}` : `file://${encoded}`;
	}

	private async fileToDataUri(file: TFile): Promise<string> {
		const buffer = await this.app.vault.readBinary(file);
		const mime = this.getMimeType(file.extension);
		return `data:${mime};base64,${this.arrayBufferToBase64(buffer)}`;
	}

	private arrayBufferToBase64(buffer: ArrayBuffer): string {
		const bytes = new Uint8Array(buffer);
		const chunkSize = 0x8000;
		let binary = "";

		for (let index = 0; index < bytes.length; index += chunkSize) {
			binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
		}

		return btoa(binary);
	}

	private isImageFile(file: TFile): boolean {
		return ["apng", "avif", "gif", "jpg", "jpeg", "png", "svg", "webp"].includes(
			file.extension.toLowerCase()
		);
	}

	private getMimeType(extension: string): string {
		const lower = extension.toLowerCase();
		const mimeTypes: Record<string, string> = {
			apng: "image/apng",
			avif: "image/avif",
			gif: "image/gif",
			jpg: "image/jpeg",
			jpeg: "image/jpeg",
			png: "image/png",
			svg: "image/svg+xml",
			webp: "image/webp"
		};

		return mimeTypes[lower] ?? "application/octet-stream";
	}

	private isRemoteOrDataUri(src: string): boolean {
		return /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(src);
	}

	private getRelativePath(fromFilePath: string, toFilePath: string): string {
		const fromParts = fromFilePath.split("/").slice(0, -1);
		const toParts = toFilePath.split("/");
		let shared = 0;

		while (
			shared < fromParts.length &&
			shared < toParts.length &&
			fromParts[shared] === toParts[shared]
		) {
			shared += 1;
		}

		const upward = fromParts.slice(shared).map(() => "..");
		const downward = toParts.slice(shared);
		return encodeURI([...upward, ...downward].join("/") || toFilePath);
	}

	private findFirstHeading(markdown: string): string | null {
		const match = markdown.match(/^#\s+(.+?)\s*#*\s*$/m);
		return match ? this.stripMarkdownInline(match[1]) : null;
	}

	private hasTopLevelHeading(markdown: string): boolean {
		return /^#\s+.+$/m.test(markdown);
	}

	private stripMarkdownInline(text: string): string {
		return text
			.replace(/`([^`]+)`/g, "$1")
			.replace(/\*\*([^*]+)\*\*/g, "$1")
			.replace(/\*([^*]+)\*/g, "$1")
			.replace(/__([^_]+)__/g, "$1")
			.replace(/_([^_]+)_/g, "$1")
			.replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
			.replace(/#+$/g, "")
			.trim();
	}

	private titleCase(text: string): string {
		return text.replace(/\b\w/g, (char) => char.toUpperCase());
	}

	private slugify(text: string): string {
		const slug = text
			.toLowerCase()
			.trim()
			.replace(/[^\p{L}\p{N}\s-]/gu, "")
			.replace(/\s+/g, "-")
			.replace(/-+/g, "-")
			.slice(0, 80);

		return slug || "section";
	}

	private escapeHtml(text: string): string {
		return text
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#39;");
	}

	private escapeMarkdownText(text: string): string {
		return text.replace(/\\/g, "\\\\").replace(/([\[\]])/g, "\\$1");
	}

	private escapeMarkdownHeading(text: string): string {
		return text.replace(/\r?\n/g, " ").trim() || this.t("fallbackHtmlPage");
	}

	private escapeYamlValue(text: string): string {
		return text.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
	}

	private async replaceAsync(
		text: string,
		regex: RegExp,
		replacer: (...args: string[]) => Promise<string>
	): Promise<string> {
		const matches = Array.from(text.matchAll(regex));
		if (matches.length === 0) {
			return text;
		}

		const replacements = await Promise.all(matches.map((match) => replacer(...(match as string[]))));
		let result = "";
		let lastIndex = 0;

		matches.forEach((match, index) => {
			result += text.slice(lastIndex, match.index);
			result += replacements[index];
			lastIndex = (match.index ?? 0) + match[0].length;
		});

		return result + text.slice(lastIndex);
	}
}

class ReadableHtmlView extends FileView {
	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType(): string {
		return VIEW_TYPE_READABLE_HTML;
	}

	getDisplayText(): string {
		return this.file?.basename ?? "Readable HTML";
	}

	async onLoadFile(file: TFile): Promise<void> {
		const html = await this.app.vault.cachedRead(file);
		const iframe = this.createIframe();

		this.contentEl.empty();
		this.contentEl.setAttr(
			"style",
			"height: 100%; padding: 0; overflow: hidden; background: var(--background-primary);"
		);
		this.contentEl.appendChild(iframe);

		iframe.srcdoc = this.injectBaseHref(html, this.getBaseHref(file.path));
	}

	async onUnloadFile(): Promise<void> {
		this.contentEl.empty();
	}

	private createIframe(): HTMLIFrameElement {
		const iframe = document.createElement("iframe");
		iframe.setAttribute("title", "Readable HTML");
		iframe.setAttribute("sandbox", "allow-same-origin allow-popups allow-popups-to-escape-sandbox");
		iframe.setAttribute(
			"csp",
			[
				"default-src 'none'",
				"script-src 'none'",
				"object-src 'none'",
				"frame-src 'none'",
				"style-src 'unsafe-inline'",
				"img-src data: file: https: http:",
				"font-src data: file:",
				"media-src data: file:"
			].join("; ")
		);
		iframe.setAttr(
			"style",
			"width: 100%; height: 100%; border: 0; display: block; background: white;"
		);
		return iframe;
	}

	private injectBaseHref(html: string, baseHref: string | null): string {
		if (!baseHref) {
			return html;
		}

		const parser = new DOMParser();
		const document = parser.parseFromString(html, "text/html");
		let head = document.head;

		if (!head) {
			head = document.createElement("head");
			document.documentElement.prepend(head);
		}

		const existingBase = head.querySelector("base");
		if (existingBase) {
			existingBase.setAttribute("href", baseHref);
		} else {
			const base = document.createElement("base");
			base.setAttribute("href", baseHref);
			head.prepend(base);
		}

		this.preserveSrcdocFragmentLinks(document);
		return `<!doctype html>\n${document.documentElement.outerHTML}`;
	}

	private preserveSrcdocFragmentLinks(document: Document): void {
		document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((link) => {
			const href = link.getAttribute("href");
			if (href && href !== "#") {
				link.setAttribute("href", `about:srcdoc${href}`);
			}
		});
	}

	private getBaseHref(vaultPath: string): string | null {
		if (!(this.app.vault.adapter instanceof FileSystemAdapter)) {
			return null;
		}

		const basePath = normalizePath(this.app.vault.adapter.getBasePath());
		const folderPath = vaultPath.split("/").slice(0, -1).join("/");
		const absoluteFolder = normalizePath([basePath, folderPath].filter(Boolean).join("/"));
		return `${this.pathToFileUri(absoluteFolder)}/`;
	}

	private pathToFileUri(path: string): string {
		const normalized = path.replace(/\\/g, "/");
		const encoded = normalized
			.split("/")
			.map((part) => encodeURIComponent(part))
			.join("/")
			.replace(/^([A-Za-z])%3A/, "$1:");

		return /^[A-Za-z]:\//.test(normalized) ? `file:///${encoded}` : `file://${encoded}`;
	}
}

class ReadableHtmlSettingTab extends PluginSettingTab {
	constructor(app: App, private plugin: ReadableHtmlExporterPlugin) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h2", { text: this.plugin.t("settingsTitle") });

		new Setting(containerEl)
			.setName(this.plugin.t("settingLanguageName"))
			.setDesc(this.plugin.t("settingLanguageDesc"))
			.addDropdown((dropdown) => {
				dropdown
					.addOption("zh", this.plugin.t("languageChinese"))
					.addOption("en", this.plugin.t("languageEnglish"))
					.setValue(this.plugin.getInterfaceLanguage())
					.onChange(async (value) => {
						this.plugin.settings.interfaceLanguage = value === "en" ? "en" : "zh";
						await this.plugin.saveSettings();
						new Notice(this.plugin.t("noticeReloadRequired"));
						this.display();
					});
			});

		new Setting(containerEl)
			.setName(this.plugin.t("settingExportFolderName"))
			.setDesc(this.plugin.t("settingExportFolderDesc"))
			.addText((text) =>
				text
					.setPlaceholder("HTML Pages")
					.setValue(this.plugin.settings.exportFolder)
					.onChange(async (value) => {
						this.plugin.settings.exportFolder = value.trim() || DEFAULT_SETTINGS.exportFolder;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName(this.plugin.t("settingStyleName"))
			.setDesc(this.plugin.t("settingStyleDesc"))
			.addDropdown((dropdown) => {
				Object.keys(HTML_STYLE_OPTIONS).forEach((value) => {
					dropdown.addOption(
						value,
						this.plugin.getStyleLabel(value as HtmlStylePreset)
					);
				});

				dropdown.setValue(this.plugin.settings.stylePreset).onChange(async (value) => {
					this.plugin.settings.stylePreset = value as HtmlStylePreset;
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName(this.plugin.t("settingPreserveFoldersName"))
			.setDesc(this.plugin.t("settingPreserveFoldersDesc"))
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.preserveFolderStructure)
					.onChange(async (value) => {
						this.plugin.settings.preserveFolderStructure = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName(this.plugin.t("settingAddTitleName"))
			.setDesc(this.plugin.t("settingAddTitleDesc"))
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.addTitleFromFilename).onChange(async (value) => {
					this.plugin.settings.addTitleFromFilename = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName(this.plugin.t("settingWikilinksName"))
			.setDesc(this.plugin.t("settingWikilinksDesc"))
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.linkWikilinksToHtml).onChange(async (value) => {
					this.plugin.settings.linkWikilinksToHtml = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName(this.plugin.t("settingOpenHtmlName"))
			.setDesc(this.plugin.t("settingOpenHtmlDesc"))
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.openHtmlInObsidian).onChange(async (value) => {
					this.plugin.settings.openHtmlInObsidian = value;
					await this.plugin.saveSettings();
					new Notice(this.plugin.t("noticeReloadRequired"));
				})
			);

		new Setting(containerEl)
			.setName(this.plugin.t("settingLauncherName"))
			.setDesc(this.plugin.t("settingLauncherDesc"))
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.createLauncherNote).onChange(async (value) => {
					this.plugin.settings.createLauncherNote = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName(this.plugin.t("settingInsertLinkName"))
			.setDesc(this.plugin.t("settingInsertLinkDesc"))
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.insertLinkInSource).onChange(async (value) => {
					this.plugin.settings.insertLinkInSource = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName(this.plugin.t("settingEmbedImagesName"))
			.setDesc(this.plugin.t("settingEmbedImagesDesc"))
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.embedLocalImages).onChange(async (value) => {
					this.plugin.settings.embedLocalImages = value;
					await this.plugin.saveSettings();
				})
			);
	}
}

const CLEAN_HTML_CSS = `
:root {
	color-scheme: light;
	--page-bg: #f3f0e8;
	--paper: #fbf8f1;
	--ink: #20201d;
	--muted: #77736a;
	--line: #d8d1c6;
	--line-soft: #ebe6dd;
	--accent: #c7352b;
	--accent-soft: #f8ede9;
	--quote-bg: #f8f4eb;
	--code-bg: #eee9df;
	--link: #2f7a4b;
}

* {
	box-sizing: border-box;
}

html {
	background: var(--page-bg);
	font-size: 16px;
	scroll-behavior: smooth;
	scroll-padding-top: 1.4rem;
}

body {
	margin: 0;
	color: var(--ink);
	background: var(--page-bg);
	font-family: Georgia, "Times New Roman", "Noto Serif SC", "Songti SC", SimSun, serif;
	line-height: 1.76;
	letter-spacing: 0;
	text-rendering: optimizeLegibility;
	-webkit-font-smoothing: antialiased;
}

.page {
	width: min(100%, 860px);
	margin: 0 auto;
	padding: 2.8rem 1.6rem 5rem;
}

.article-hero {
	width: 100%;
	max-width: 720px;
	margin: 0 auto 2.4rem;
	padding: 1.4rem 0 2rem;
	text-align: center;
	border-bottom: 1px solid var(--line);
	background: transparent;
}

.article-hero h1 {
	max-width: 720px;
	margin: 0 auto;
	color: #1f1f1d;
	font-size: 2.25rem;
	font-weight: 700;
	line-height: 1.25;
	letter-spacing: 0;
	text-align: center;
}

.article-hero h1 span {
	display: block;
}

.article-deck {
	max-width: 680px;
	margin: 0.95rem auto 0;
	color: var(--muted);
	font-size: 1rem;
	font-style: italic;
	line-height: 1.72;
}

.article-deck p {
	margin: 0;
}

.article-deck strong {
	color: inherit;
	font-weight: 600;
}

.hero-rule {
	width: 3.4rem;
	height: 2px;
	margin: 1.55rem auto 0;
	background: var(--accent);
}

.table-of-contents {
	max-width: 720px;
	margin: 0 auto 3.2rem;
	padding: 1.35rem 1.45rem 1.25rem;
	border: 1px solid var(--line);
	border-radius: 8px;
	background: rgba(251, 248, 241, 0.86);
}

.table-of-contents h2 {
	margin: 0 0 0.85rem;
	padding: 0;
	border: 0;
	color: var(--muted);
	font-size: 0.9rem;
	font-weight: 700;
	line-height: 1.3;
}

.table-of-contents h2::before {
	content: none;
}

.table-of-contents ol {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 0.32rem 1.35rem;
	margin: 0;
	padding: 0;
	list-style: none;
	counter-reset: toc;
	font-size: 0.86rem;
	line-height: 1.48;
}

.table-of-contents li {
	margin: 0;
	padding: 0;
	counter-increment: toc;
	break-inside: avoid;
}

.table-of-contents a {
	display: grid;
	grid-template-columns: 1.9em minmax(0, 1fr);
	gap: 0.3rem;
	margin: 0 -0.35rem;
	padding: 0.1rem 0.35rem;
	border-radius: 5px;
	color: var(--ink);
	text-decoration: none;
	cursor: pointer;
	transition: color 160ms ease, background-color 160ms ease;
}

.table-of-contents a::before {
	content: counter(toc) ".";
	color: var(--muted);
	text-align: right;
	transition: color 160ms ease;
}

.table-of-contents a:hover,
.table-of-contents a:focus-visible {
	background: var(--accent-soft);
	color: var(--accent);
}

.table-of-contents a:hover::before,
.table-of-contents a:focus-visible::before {
	color: var(--accent);
}

.side-table-of-contents {
	display: none;
}

.side-toc-title {
	margin: 0 0 0.75rem;
	color: var(--muted);
	font-size: 0.72rem;
	font-weight: 700;
	text-transform: uppercase;
}

.side-table-of-contents ol {
	margin: 0;
	padding: 0;
	list-style: none;
	counter-reset: side-toc;
	font-size: 0.76rem;
	line-height: 1.36;
}

.side-table-of-contents li {
	margin: 0;
	padding: 0;
	counter-increment: side-toc;
}

.side-table-of-contents a {
	display: grid;
	grid-template-columns: 2em minmax(0, 1fr);
	gap: 0.28rem;
	margin: 0 -0.35rem;
	padding: 0.22rem 0.35rem;
	border-radius: 5px;
	color: var(--muted);
	text-decoration: none;
	cursor: pointer;
	transition: color 160ms ease, background-color 160ms ease;
}

.side-table-of-contents a::before {
	content: counter(side-toc) ".";
	color: #aaa39a;
	text-align: right;
	transition: color 160ms ease;
}

.side-table-of-contents a:hover,
.side-table-of-contents a:focus-visible {
	background: var(--accent-soft);
	color: var(--accent);
}

.side-table-of-contents a:hover::before,
.side-table-of-contents a:focus-visible::before {
	color: var(--accent);
}

.article-body {
	counter-reset: section;
	width: 100%;
	max-width: 720px;
	margin: 0 auto;
	font-size: 1rem;
}

.article-body > * {
	max-width: 100%;
}

.article-body h2,
.article-body h3,
.article-body h4 {
	color: #20201d;
	letter-spacing: 0;
	line-height: 1.32;
}

.article-body h2 {
	counter-increment: section;
	position: relative;
	margin: 2.85rem 0 1rem;
	padding: 0;
	border: 0;
	font-size: 1.55rem;
	font-weight: 700;
}

.article-body h2:target {
	color: var(--accent);
}

.article-body h2::before {
	content: counter(section, cjk-ideographic) "、";
	display: inline-block;
	min-width: 2.35em;
	margin-right: 0.2rem;
	color: var(--accent);
	font-weight: 500;
}

.article-body h3 {
	margin: 2.1rem 0 0.72rem;
	font-size: 1.25rem;
	font-weight: 700;
}

.article-body h4 {
	margin: 1.65rem 0 0.58rem;
	font-size: 1.08rem;
	font-weight: 700;
}

p {
	margin: 0.9rem 0;
}

a {
	color: var(--link);
	text-decoration-thickness: 1px;
	text-underline-offset: 0.18em;
}

strong {
	color: var(--accent);
	font-weight: 700;
}

em {
	color: var(--muted);
}

blockquote {
	position: relative;
	margin: 1.55rem 0;
	padding: 0.95rem 1.15rem 0.95rem 1.25rem;
	border: 0;
	border-left: 3px solid var(--line);
	border-radius: 6px;
	background: var(--quote-bg);
	color: #272622;
}

blockquote.quote-block {
	color: #3c3932;
}

blockquote.callout-block {
	border: 1px solid var(--line);
	border-left: 4px solid var(--accent);
	background: #f9f2eb;
}

blockquote.callout-highlight {
	box-shadow: inset 0 0 0 1px rgba(199, 53, 43, 0.05);
}

blockquote.callout-conclusion {
	padding: 1.05rem 1.25rem;
	border: 1px solid #d9cdc0;
	border-top: 3px solid var(--accent);
	border-left-color: #d9cdc0;
	background: var(--paper);
	box-shadow: 0 10px 28px rgba(70, 48, 26, 0.06);
}

blockquote p:first-child {
	margin-top: 0;
}

blockquote p:last-child {
	margin-bottom: 0;
}

blockquote strong {
	color: var(--accent);
}

blockquote.callout-block p:first-child strong:first-child {
	display: inline-block;
	margin-bottom: 0.25rem;
	padding: 0.06rem 0.42rem;
	border-radius: 999px;
	background: var(--accent-soft);
	color: var(--accent);
	font-size: 0.78rem;
	line-height: 1.45;
}

ul,
ol {
	margin: 0.9rem 0 1.05rem 1.35rem;
	padding: 0;
}

li {
	margin: 0.35rem 0;
	padding-left: 0.25rem;
}

li::marker {
	color: #151513;
	font-weight: 600;
}

hr {
	margin: 2.2rem 0;
	border: 0;
	border-top: 1px solid var(--line-soft);
}

.table-scroll {
	max-width: 100%;
	margin: 1.45rem 0;
	border: 1px solid var(--line);
	border-radius: 6px;
	background: var(--paper);
	overflow-x: auto;
}

table {
	width: max-content;
	min-width: 100%;
	border-collapse: separate;
	border-spacing: 0;
	background: var(--paper);
	font-size: 0.84rem;
	line-height: 1.55;
}

thead {
	background: transparent;
}

th {
	background: #ebe6dc;
	color: #4a463f;
	font-weight: 700;
	white-space: nowrap;
}

th,
td {
	padding: 0.55rem 0.66rem;
	border: 0;
	border-right: 1px solid var(--line);
	border-bottom: 1px solid var(--line);
	text-align: left;
	vertical-align: top;
}

tr > :last-child {
	border-right: 0;
}

tbody tr:last-child td {
	border-bottom: 0;
}

tbody tr:nth-child(even) {
	background: #f7f3ea;
}

tbody tr:hover {
	background: #f4eadc;
}

pre,
code {
	font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
}

code {
	padding: 0.08rem 0.28rem;
	border-radius: 4px;
	background: var(--code-bg);
	font-size: 0.82em;
}

pre {
	position: relative;
	margin: 1.6rem 0;
	padding: 2rem 1rem 1rem;
	border: 1px solid var(--line);
	border-left: 4px solid #bbb3a8;
	border-radius: 6px;
	background: var(--code-bg);
	overflow-x: auto;
	line-height: 1.5;
}

pre::before {
	content: "代码 / 图示";
	position: absolute;
	top: 0.55rem;
	left: 0.9rem;
	color: var(--muted);
	font-family: Georgia, "Times New Roman", "Noto Serif SC", "Songti SC", SimSun, serif;
	font-size: 0.72rem;
	font-weight: 700;
	line-height: 1;
}

pre.code-figure::before {
	content: attr(data-label);
}

pre.code-figure.ascii-figure {
	border-left-color: var(--accent);
	background: #f1ece3;
}

pre.code-figure.ascii-figure::before {
	color: var(--accent);
}

pre code {
	padding: 0;
	background: transparent;
	font-size: 0.78rem;
}

img {
	display: block;
	max-width: 100%;
	height: auto;
	margin: 1.5rem auto;
}

sup {
	line-height: 0;
}

@media (min-width: 1360px) {
	.side-table-of-contents {
		display: block;
		position: fixed;
		top: 4.6rem;
		right: max(1.2rem, calc((100vw - 860px) / 2 - 14.8rem));
		width: 13rem;
		max-height: calc(100vh - 6rem);
		padding: 0.85rem 0.95rem;
		border-left: 1px solid var(--line-soft);
		background: rgba(243, 240, 232, 0.92);
		overflow: auto;
	}
}

@media (max-width: 780px) {
	html {
		font-size: 16px;
	}

	.page {
		padding: 1.8rem 1rem 3.2rem;
	}

	.article-hero {
		margin-bottom: 1.9rem;
		padding-top: 0.8rem;
		padding-bottom: 1.55rem;
	}

	.article-hero h1 {
		font-size: 1.75rem;
	}

	.article-deck {
		font-size: 0.95rem;
	}

	.table-of-contents {
		margin-bottom: 2.5rem;
		padding: 1.1rem 1rem;
	}

	.table-of-contents ol {
		grid-template-columns: 1fr;
		gap: 0.45rem;
	}

	.article-body h2 {
		margin-top: 2.45rem;
		font-size: 1.35rem;
	}

	.article-body h2::before {
		min-width: 0;
		margin-right: 0.15rem;
	}

	blockquote {
		padding: 0.85rem 0.95rem;
	}

	table {
		font-size: 0.8rem;
	}
}

@media print {
	html,
	body {
		background: #fff;
	}

	.page {
		width: 100%;
		padding: 0;
	}

	.article-hero {
		margin-inline: 0;
		padding-inline: 0;
	}

	a {
		color: inherit;
	}
}
`.trim();
