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
		settingEmbedImagesDesc: "把本地图片转为 data URI，方便 HTML 文件独立打开。",
		settingSyncAnnotationsName: "批注同步回原 Markdown",
		settingSyncAnnotationsDesc: "在 Obsidian 内阅读 HTML 时，选中文本添加的批注会写回源笔记。独立浏览器打开时仍可临时划线和批注。",
		annotationToolbarUnderline: "划线",
		annotationInlinePlaceholder: "这里可以写备注...",
		annotationInlineSave: "保存",
		annotationCardPlaceholder: "添加批注...",
		annotationComposerSave: "保存",
		annotationDelete: "删除",
		annotationPanelTitle: "批注",
		annotationQuoteLabel: "原文",
		annotationNoteLabel: "批注",
		annotationSyncDisabled: "仅保存在当前页面",
		annotationSyncedNotice: "批注已同步到原 Markdown。",
		annotationSyncFailedNotice: "批注同步失败，请稍后重试。",
		annotationDeletedNotice: "批注已删除。",
		annotationDeleteFailedNotice: "批注删除同步失败，请稍后重试。"
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
		settingEmbedImagesDesc: "Converts local images to data URIs so the HTML file can be opened standalone.",
		settingSyncAnnotationsName: "Sync annotations back to Markdown",
		settingSyncAnnotationsDesc: "When reading HTML inside Obsidian, selected-text annotations are written back to the source note. Standalone browser reading still supports temporary highlights and comments.",
		annotationToolbarUnderline: "Underline",
		annotationInlinePlaceholder: "Write a note here...",
		annotationInlineSave: "Save",
		annotationCardPlaceholder: "Add a note...",
		annotationComposerSave: "Save",
		annotationDelete: "Delete",
		annotationPanelTitle: "Annotations",
		annotationQuoteLabel: "Quote",
		annotationNoteLabel: "Note",
		annotationSyncDisabled: "Saved in this page only",
		annotationSyncedNotice: "Annotation synced to the source Markdown note.",
		annotationSyncFailedNotice: "Annotation sync failed. Please try again.",
		annotationDeletedNotice: "Annotation deleted.",
		annotationDeleteFailedNotice: "Annotation deletion could not be synced. Please try again."
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
	syncAnnotationsToSource: boolean;
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
	insertLinkInSource: true,
	syncAnnotationsToSource: true
};

const SOURCE_LINK_BLOCK_REGEX =
	/(?:%% readable-html-exporter-link:start %%\r?\n)?^> (?:阅读版 HTML|HTML 页面|Readable HTML|HTML Page)\s*[：:]\s*\[\[[^\]]+\|(?:打开对应 HTML|打开 HTML 页面|Open HTML|Open HTML Page)\]\]\s*\r?\n(?:%% readable-html-exporter-link:end %%\r?\n?)?/gm;

const INVALID_FILE_NAME_CHARS = new Set(['<', '>', ':', '"', '/', "\\", "|", "?", "*"]);

const ANNOTATIONS_BLOCK_START = "<!-- notes-to-html-pages-annotations:start -->";
const ANNOTATIONS_BLOCK_END = "<!-- notes-to-html-pages-annotations:end -->";
const ANNOTATIONS_BLOCK_REGEX =
	/<!-- notes-to-html-pages-annotations:start -->[\s\S]*?<!-- notes-to-html-pages-annotations:end -->/;
const ANNOTATIONS_DATA_REGEX =
	/<!-- notes-to-html-pages-annotations:data\s*([\s\S]*?)\s*notes-to-html-pages-annotations:data-end -->/;

interface HtmlAnnotation {
	id: string;
	selectedText: string;
	note: string;
	createdAt: string;
	sourcePath?: string;
}

interface HtmlAnnotationCreatedMessage {
	plugin: "notes-to-html-pages";
	type: "annotation-created";
	annotation: HtmlAnnotation;
}

interface HtmlAnnotationDeletedMessage {
	plugin: "notes-to-html-pages";
	type: "annotation-deleted";
	annotationId: string;
	sourcePath: string;
}

type HtmlAnnotationMessage = HtmlAnnotationCreatedMessage | HtmlAnnotationDeletedMessage;

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
			this.registerView(VIEW_TYPE_READABLE_HTML, (leaf) => new ReadableHtmlView(leaf, this));

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
		const loadedData: unknown = await this.loadData();
		this.settings = Object.assign({}, DEFAULT_SETTINGS, this.normalizeLoadedSettings(loadedData));
	}

	private normalizeLoadedSettings(data: unknown): Partial<ReadableHtmlSettings> {
		if (!this.isRecord(data)) {
			return {};
		}

		const settings: Partial<ReadableHtmlSettings> = {};

		if (data.interfaceLanguage === "zh" || data.interfaceLanguage === "en") {
			settings.interfaceLanguage = data.interfaceLanguage;
		}
		if (typeof data.exportFolder === "string") {
			settings.exportFolder = data.exportFolder;
		}
		if (data.stylePreset === "clean") {
			settings.stylePreset = data.stylePreset;
		}
		if (typeof data.preserveFolderStructure === "boolean") {
			settings.preserveFolderStructure = data.preserveFolderStructure;
		}
		if (typeof data.addTitleFromFilename === "boolean") {
			settings.addTitleFromFilename = data.addTitleFromFilename;
		}
		if (typeof data.linkWikilinksToHtml === "boolean") {
			settings.linkWikilinksToHtml = data.linkWikilinksToHtml;
		}
		if (typeof data.embedLocalImages === "boolean") {
			settings.embedLocalImages = data.embedLocalImages;
		}
		if (typeof data.openHtmlInObsidian === "boolean") {
			settings.openHtmlInObsidian = data.openHtmlInObsidian;
		}
		if (typeof data.createLauncherNote === "boolean") {
			settings.createLauncherNote = data.createLauncherNote;
		}
		if (typeof data.insertLinkInSource === "boolean") {
			settings.insertLinkInSource = data.insertLinkInSource;
		}
		if (typeof data.syncAnnotationsToSource === "boolean") {
			settings.syncAnnotationsToSource = data.syncAnnotationsToSource;
		}

		return settings;
	}

	private isRecord(value: unknown): value is Record<string, unknown> {
		return typeof value === "object" && value !== null && !Array.isArray(value);
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
		const annotations = this.extractAnnotations(raw);
		const { content, frontmatterTitle } = this.stripFrontmatter(raw);
		const contentWithoutSourceLink = this.removeSourceLinkBlock(content);
		const contentWithoutAnnotations = this.removeAnnotationsBlock(contentWithoutSourceLink);
		const prepared = await this.prepareMarkdown(contentWithoutAnnotations, file);
		const title = this.findFirstHeading(contentWithoutAnnotations) ?? frontmatterTitle ?? file.basename;
		const shouldAddTitle =
			this.settings.addTitleFromFilename && !this.hasTopLevelHeading(prepared);
		const markdown = shouldAddTitle ? `# ${title}\n\n${prepared}` : prepared;
		const stylePreset = this.getStylePreset();
		const renderedBody = this.markdown.render(markdown, {});
		const documentLanguage: UiLanguage = /[\u3400-\u9fff]/.test(raw) ? "zh" : "en";
		const body = this.buildStyledBody(renderedBody, title, stylePreset, documentLanguage);
		const lang = documentLanguage === "zh" ? "zh-CN" : "en";
		const annotationConfig = this.createAnnotationConfig(file, documentLanguage);
		const annotationData = this.createAnnotationDataScript(annotations);

		return {
			title,
			html: [
			"<!doctype html>",
			`<html lang="${lang}">`,
			"<head>",
			'<meta charset="utf-8">',
			'<meta name="viewport" content="width=device-width, initial-scale=1">',
			`<meta name="notes-to-html-pages-style" content="${stylePreset}">`,
			`<meta name="notes-to-html-pages-source" content="${this.escapeHtml(file.path)}">`,
			`<meta name="notes-to-html-pages-sync-annotations" content="${this.settings.syncAnnotationsToSource ? "true" : "false"}">`,
			`<title>${this.escapeHtml(title)}</title>`,
			`<style>${this.getStyleCss(stylePreset)}</style>`,
			"</head>",
			`<body class="style-${stylePreset}">`,
			'<main class="page">',
			body,
			"</main>",
			annotationConfig,
			annotationData,
			`<script>${ANNOTATION_SCRIPT}</script>`,
			"</body>",
			"</html>"
			].join("\n")
		};
	}

	async syncAnnotationToSource(sourcePath: string, annotation: HtmlAnnotation): Promise<void> {
		if (!this.settings.syncAnnotationsToSource) {
			return;
		}

		const sourceFile = this.app.vault.getAbstractFileByPath(sourcePath);
		if (!(sourceFile instanceof TFile) || sourceFile.extension !== "md") {
			throw new Error(`Source Markdown file not found: ${sourcePath}`);
		}

		const normalized = this.normalizeAnnotation(annotation, sourceFile.path);
		const raw = await this.app.vault.read(sourceFile);
		const annotations = this.extractAnnotations(raw);
		const existingIndex = annotations.findIndex((item) => item.id === normalized.id);
		const nextAnnotations =
			existingIndex >= 0
				? annotations.map((item, index) => (index === existingIndex ? normalized : item))
				: [...annotations, normalized];
		const block = this.createAnnotationsMarkdownBlock(nextAnnotations, this.getInterfaceLanguage());
		const updated = ANNOTATIONS_BLOCK_REGEX.test(raw)
			? raw.replace(ANNOTATIONS_BLOCK_REGEX, block)
			: `${raw.replace(/\s+$/g, "")}\n\n${block}\n`;

		if (updated !== raw) {
			await this.app.vault.modify(sourceFile, updated);
		}
	}

	async deleteAnnotationFromSource(sourcePath: string, annotationId: string): Promise<void> {
		if (!this.settings.syncAnnotationsToSource) {
			return;
		}

		const sourceFile = this.app.vault.getAbstractFileByPath(sourcePath);
		if (!(sourceFile instanceof TFile) || sourceFile.extension !== "md") {
			throw new Error(`Source Markdown file not found: ${sourcePath}`);
		}

		const raw = await this.app.vault.read(sourceFile);
		const annotations = this.extractAnnotations(raw);
		const nextAnnotations = annotations.filter((annotation) => annotation.id !== annotationId);
		if (nextAnnotations.length === annotations.length) {
			return;
		}

		const updated = nextAnnotations.length > 0
			? raw.replace(
				ANNOTATIONS_BLOCK_REGEX,
				this.createAnnotationsMarkdownBlock(nextAnnotations, this.getInterfaceLanguage())
			)
			: raw.replace(ANNOTATIONS_BLOCK_REGEX, "").replace(/\n{3,}/g, "\n\n").replace(/\s+$/g, "\n");

		if (updated !== raw) {
			await this.app.vault.modify(sourceFile, updated);
		}
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

	private createAnnotationConfig(sourceFile: TFile, documentLanguage: UiLanguage): string {
		const textKeys = [
			"annotationToolbarUnderline",
			"annotationInlinePlaceholder",
			"annotationInlineSave",
			"annotationCardPlaceholder",
			"annotationComposerSave",
			"annotationDelete",
			"annotationPanelTitle",
			"annotationQuoteLabel",
			"annotationNoteLabel",
			"annotationSyncDisabled"
		] as Array<keyof typeof UI_TEXT.zh>;
		const text: Record<string, string> = {};

		for (const key of textKeys) {
			text[key] = this.tForLanguage(documentLanguage, key);
		}

		return `<script type="application/json" id="notes-to-html-pages-config">${this.escapeJsonScript(
			JSON.stringify({
				sourcePath: sourceFile.path,
				syncAnnotationsToSource: this.settings.syncAnnotationsToSource,
				text
			})
		)}</script>`;
	}

	private createAnnotationDataScript(annotations: HtmlAnnotation[]): string {
		return `<script type="application/json" id="notes-to-html-pages-annotations">${this.escapeJsonScript(
			JSON.stringify(annotations)
		)}</script>`;
	}

	private extractAnnotations(markdown: string): HtmlAnnotation[] {
		const block = markdown.match(ANNOTATIONS_BLOCK_REGEX)?.[0];
		if (!block) {
			return [];
		}

		const dataMatch = block.match(ANNOTATIONS_DATA_REGEX);
		if (!dataMatch) {
			return [];
		}

		try {
			const rawData = dataMatch[1].trim();
			const json = /%[0-9a-f]{2}/i.test(rawData) ? decodeURIComponent(rawData) : rawData;
			const parsed = JSON.parse(json) as unknown;

			if (!Array.isArray(parsed)) {
				return [];
			}

			const annotations: HtmlAnnotation[] = [];
			for (const item of parsed) {
				if (this.isHtmlAnnotation(item)) {
					annotations.push(this.normalizeAnnotation(item, item.sourcePath));
				}
			}
			return annotations;
		} catch (error) {
			console.warn("Notes to HTML Pages could not parse saved annotations.", error);
			return [];
		}
	}

	private removeAnnotationsBlock(markdown: string): string {
		return markdown.replace(ANNOTATIONS_BLOCK_REGEX, "").replace(/\n{3,}/g, "\n\n");
	}

	private isHtmlAnnotation(value: unknown): value is HtmlAnnotation {
		return (
			this.isRecord(value) &&
			typeof value.id === "string" &&
			typeof value.selectedText === "string" &&
			typeof value.note === "string" &&
			typeof value.createdAt === "string" &&
			(typeof value.sourcePath === "undefined" || typeof value.sourcePath === "string")
		);
	}

	private normalizeAnnotation(annotation: HtmlAnnotation, sourcePath?: string): HtmlAnnotation {
		return {
			id: annotation.id.trim() || `annotation-${Date.now()}`,
			selectedText: this.compactText(annotation.selectedText).slice(0, 2000),
			note: this.compactText(annotation.note).slice(0, 2000),
			createdAt: annotation.createdAt || new Date().toISOString(),
			sourcePath: sourcePath || annotation.sourcePath
		};
	}

	private createAnnotationsMarkdownBlock(
		annotations: HtmlAnnotation[],
		language: UiLanguage
	): string {
		const title = language === "zh" ? "## HTML 页面批注" : "## HTML Page Annotations";
		const quoteLabel = this.tForLanguage(language, "annotationQuoteLabel");
		const noteLabel = this.tForLanguage(language, "annotationNoteLabel");
		const readableItems = annotations
			.map((annotation) => {
				const lines = [
					`- **${this.formatAnnotationDate(annotation.createdAt)}**`,
					`  - ${quoteLabel}: ==${this.escapeAnnotationMarkdown(annotation.selectedText)}==`
				];
				if (annotation.note) {
					lines.push(`  - ${noteLabel}: ${this.escapeAnnotationMarkdown(annotation.note)}`);
				}
				lines.push(`  - ID: \`${this.escapeMarkdownCode(annotation.id)}\``);
				return lines.join("\n");
			})
			.join("\n");
		const data = encodeURIComponent(JSON.stringify(annotations, null, 2));

		return [
			ANNOTATIONS_BLOCK_START,
			title,
			"",
			readableItems,
			"",
			`<!-- notes-to-html-pages-annotations:data\n${data}\nnotes-to-html-pages-annotations:data-end -->`,
			ANNOTATIONS_BLOCK_END
		].join("\n");
	}

	private sanitizeGeneratedBody(wrapper: Element): void {
		Array.from(wrapper.querySelectorAll("script")).forEach((element) => element.remove());
		Array.from(wrapper.querySelectorAll("*")).forEach((element) => {
			Array.from(element.attributes).forEach((attribute) => {
				const name = attribute.name.toLowerCase();
				const value = attribute.value.trim();
				if (
					name.startsWith("on") ||
					(["href", "src", "xlink:href"].includes(name) && /^javascript:/i.test(value))
				) {
					element.removeAttribute(attribute.name);
				}
			});
		});
	}

	private formatAnnotationDate(value: string): string {
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) {
			return value;
		}

		const pad = (part: number) => String(part).padStart(2, "0");
		return [
			`${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
			`${pad(date.getHours())}:${pad(date.getMinutes())}`
		].join(" ");
	}

	private compactText(text: string): string {
		return text.replace(/\s+/g, " ").trim();
	}

	private escapeAnnotationMarkdown(text: string): string {
		return this.compactText(text)
			.replace(/\\/g, "\\\\")
			.replace(/`/g, "'")
			.replace(/\[/g, "\\[")
			.replace(/]/g, "\\]")
			.replace(/==/g, "=");
	}

	private escapeMarkdownCode(text: string): string {
		return text.replace(/`/g, "'");
	}

	private escapeJsonScript(json: string): string {
		return json
			.replace(/</g, "\\u003c")
			.replace(/>/g, "\\u003e")
			.replace(/&/g, "\\u0026")
			.replace(/\u2028/g, "\\u2028")
			.replace(/\u2029/g, "\\u2029");
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
		this.sanitizeGeneratedBody(wrapper);
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
		const cleaned = Array.from(fileName, (character) =>
			INVALID_FILE_NAME_CHARS.has(character) || character.charCodeAt(0) < 32 ? "-" : character
		).join("");

		return cleaned.trim() || "untitled";
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
		return text.replace(/\\/g, "\\\\").split("[").join("\\[").split("]").join("\\]");
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
	private detachMessageListener: (() => void) | null = null;

	constructor(leaf: WorkspaceLeaf, private plugin: ReadableHtmlExporterPlugin) {
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

		this.detachMessageListener?.();
		this.attachMessageListener(iframe);

		this.contentEl.empty();
		this.contentEl.setAttr(
			"style",
			"height: 100%; padding: 0; overflow: hidden; background: var(--background-primary);"
		);
		this.contentEl.appendChild(iframe);

		iframe.srcdoc = this.injectBaseHref(html, this.getBaseHref(file.path));
	}

	async onUnloadFile(): Promise<void> {
		this.detachMessageListener?.();
		this.detachMessageListener = null;
		this.contentEl.empty();
	}

	private createIframe(): HTMLIFrameElement {
		const iframe = activeDocument.createElement("iframe");
		iframe.setAttribute("title", "Readable HTML");
		iframe.setAttribute("sandbox", "allow-scripts allow-popups allow-popups-to-escape-sandbox");
		iframe.setAttribute(
			"csp",
			[
				"default-src 'none'",
				"script-src 'unsafe-inline'",
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

	private attachMessageListener(iframe: HTMLIFrameElement): void {
		const listener = (event: MessageEvent) => {
			if (event.source !== iframe.contentWindow) {
				return;
			}

			const message: unknown = event.data;
			if (!this.isAnnotationMessage(message)) {
				return;
			}

			void this.handleAnnotationMessage(message);
		};

		activeWindow.addEventListener("message", listener);
		this.detachMessageListener = () => activeWindow.removeEventListener("message", listener);
	}

	private async handleAnnotationMessage(message: HtmlAnnotationMessage): Promise<void> {
		if (!this.plugin.settings.syncAnnotationsToSource) {
			return;
		}

		try {
			if (message.type === "annotation-created") {
				if (!message.annotation.sourcePath) {
					return;
				}
				await this.plugin.syncAnnotationToSource(message.annotation.sourcePath, message.annotation);
				new Notice(this.plugin.t("annotationSyncedNotice"));
				return;
			}

			await this.plugin.deleteAnnotationFromSource(message.sourcePath, message.annotationId);
			new Notice(this.plugin.t("annotationDeletedNotice"));
		} catch (error) {
			console.error(error);
			new Notice(
				this.plugin.t(
					message.type === "annotation-deleted"
						? "annotationDeleteFailedNotice"
						: "annotationSyncFailedNotice"
				)
			);
		}
	}

	private isAnnotationMessage(value: unknown): value is HtmlAnnotationMessage {
		if (!this.isRecord(value)) {
			return false;
		}

		if (value.plugin !== "notes-to-html-pages") {
			return false;
		}

		if (value.type === "annotation-created") {
			return this.isAnnotationPayload(value.annotation);
		}

		return (
			value.type === "annotation-deleted" &&
			typeof value.annotationId === "string" &&
			typeof value.sourcePath === "string"
		);
	}

	private isAnnotationPayload(value: unknown): value is HtmlAnnotation {
		return (
			this.isRecord(value) &&
			typeof value.id === "string" &&
			typeof value.selectedText === "string" &&
			typeof value.note === "string" &&
			typeof value.createdAt === "string" &&
			(typeof value.sourcePath === "undefined" || typeof value.sourcePath === "string")
		);
	}

	private isRecord(value: unknown): value is Record<string, unknown> {
		return typeof value === "object" && value !== null && !Array.isArray(value);
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
		this.renderSettings();
	}

	private renderSettings(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl).setName(this.plugin.t("settingsTitle")).setHeading();

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
							this.renderSettings();
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
			.setName(this.plugin.t("settingSyncAnnotationsName"))
			.setDesc(this.plugin.t("settingSyncAnnotationsDesc"))
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.syncAnnotationsToSource)
					.onChange(async (value) => {
						this.plugin.settings.syncAnnotationsToSource = value;
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

const ANNOTATION_SCRIPT = `
(() => {
	"use strict";

	const config = readJson("notes-to-html-pages-config", {});
	const savedAnnotations = readJson("notes-to-html-pages-annotations", []);
	const text = Object.assign(
		{
			annotationToolbarUnderline: "Underline",
			annotationInlinePlaceholder: "Write a note here...",
			annotationInlineSave: "Save note",
			annotationComposerSave: "Save",
			annotationDelete: "Delete",
			annotationPanelTitle: "Annotations",
			annotationCardPlaceholder: "Add a note...",
			annotationSyncDisabled: "Saved in this page only"
		},
		config.text || {}
	);
	const article = document.querySelector(".article-body");
	if (!article) return;

	const state = {
		range: null,
		annotations: []
	};
	const popover = createPopover();
	const panel = createPanel();

	document.body.append(popover, panel);
	window.addEventListener("resize", () => {
		scheduleAnnotationLayout();
		if (!usesInlineAnnotations()) {
			closeInlineAnnotations();
		}
	});
	if (document.fonts && document.fonts.ready) {
		document.fonts.ready.then(scheduleAnnotationLayout);
		}
	document.addEventListener("mouseup", (event) => {
		if (isInsideAnnotationUi(event.target)) {
			return;
		}
		window.setTimeout(updateSelectionUi, 0);
	});
	document.addEventListener("keyup", (event) => {
		if (event.key === "Escape") {
			hidePopover();
			return;
		}
		if (isEditableTarget(event.target)) {
			return;
		}
		window.setTimeout(updateSelectionUi, 0);
	});
	document.addEventListener("mousedown", (event) => {
		const target = event.target;
		if (popover.contains(target) || isEditableTarget(target)) {
			return;
		}
		cancelAnnotationEditors();
		if (target instanceof Node && !article.contains(target) && !panel.contains(target)) {
			hidePopover();
		}
	});

	for (const annotation of Array.isArray(savedAnnotations) ? savedAnnotations : []) {
		if (isAnnotation(annotation)) {
			addAnnotation(annotation, true);
		}
	}
	updatePanelVisibility();
	scheduleAnnotationLayout();

	function readJson(id, fallback) {
		const element = document.getElementById(id);
		if (!element || !element.textContent) return fallback;
		try {
			return JSON.parse(element.textContent);
		} catch (_error) {
			return fallback;
		}
	}

	function isInsideAnnotationUi(target) {
		return target instanceof Node && (popover.contains(target) || panel.contains(target));
	}

	function isEditableTarget(target) {
		return target instanceof Element && Boolean(target.closest("input, textarea, button"));
	}

	function createPopover() {
		const element = document.createElement("div");
		element.className = "annotation-popover";
		element.hidden = true;

		const actions = document.createElement("div");
		actions.className = "annotation-popover-actions";

		const underline = document.createElement("button");
		underline.type = "button";
		underline.className = "annotation-underline-button";
		underline.textContent = text.annotationToolbarUnderline;
		underline.addEventListener("click", () => saveCurrentAnnotation(""));
		actions.append(underline);

		const noteRow = document.createElement("div");
		noteRow.className = "annotation-note-row";

		const input = document.createElement("input");
		input.type = "text";
		input.className = "annotation-note-input";
		input.placeholder = text.annotationInlinePlaceholder;
		input.setAttribute("aria-label", text.annotationInlinePlaceholder);
		input.addEventListener("keydown", (event) => {
			if (event.key === "Enter") {
				event.preventDefault();
				saveCurrentAnnotation(input.value);
			}
		});

		const save = document.createElement("button");
		save.type = "button";
		save.className = "annotation-mini-save";
		save.textContent = text.annotationInlineSave;
		save.addEventListener("click", () => saveCurrentAnnotation(input.value));

		noteRow.append(input, save);
		element.append(actions, noteRow);
		return element;
	}

	function createPanel() {
		const element = document.createElement("aside");
		element.className = "annotation-panel";
		element.hidden = true;

		const title = document.createElement("div");
		title.className = "annotation-panel-title";
		title.textContent = text.annotationPanelTitle;

		const list = document.createElement("div");
		list.className = "annotation-list";

		element.append(title, list);
		return element;
	}

	function updateSelectionUi() {
		const selection = window.getSelection();
		if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
			hidePopover();
			return;
		}

		const range = selection.getRangeAt(0);
		const selectedText = compactText(range.toString());
		if (!selectedText || !article.contains(range.startContainer) || !article.contains(range.endContainer)) {
			hidePopover();
			return;
		}

		const rect = getRangeAnchorRect(range);
		if (!rect) {
			hidePopover();
			return;
		}

		state.range = range.cloneRange();
		positionPopover(rect);
		const input = popover.querySelector(".annotation-note-input");
		if (input) input.value = "";
		popover.hidden = false;
	}

	function getRangeAnchorRect(range) {
		const rects = Array.from(range.getClientRects()).filter((rect) => rect.width && rect.height);
		return rects[rects.length - 1] || null;
	}

	function positionPopover(rect) {
		popover.style.left = "0px";
		popover.style.top = "0px";
		const width = popover.offsetWidth || 280;
		const left = Math.min(
			window.scrollX + window.innerWidth - width - 14,
			Math.max(14 + window.scrollX, window.scrollX + rect.left)
		);
		const top = window.scrollY + rect.bottom + 8;
		popover.style.left = left + "px";
		popover.style.top = top + "px";
	}

	function hidePopover() {
		popover.hidden = true;
	}

	function saveCurrentAnnotation(note) {
		if (!state.range) return;

		const selectedText = compactText(state.range.toString());
		if (!selectedText) return;

		const annotation = {
			id: "ntoh-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8),
			selectedText,
			note: compactText(note),
			createdAt: new Date().toISOString(),
			sourcePath: typeof config.sourcePath === "string" ? config.sourcePath : ""
		};

		addAnnotation(annotation, false);
		hidePopover();
		const selection = window.getSelection();
		if (selection) selection.removeAllRanges();
		state.range = null;
	}

	function addAnnotation(annotation, fromSaved) {
		const normalized = {
			id: String(annotation.id || ""),
			selectedText: compactText(String(annotation.selectedText || "")),
			note: compactText(String(annotation.note || "")),
			createdAt: String(annotation.createdAt || new Date().toISOString()),
			sourcePath: String(annotation.sourcePath || config.sourcePath || "")
		};
		if (!normalized.id || !normalized.selectedText) return;

		const marked = markAnnotation(normalized, fromSaved);
		state.annotations.push(normalized);
		const annotationIndex = state.annotations.length;
		renderAnnotationCard(normalized, annotationIndex, marked);
		renderInlineAnnotation(normalized, annotationIndex, marked);
		updatePanelVisibility();
		scheduleAnnotationLayout();

		if (!fromSaved) {
			syncAnnotation(normalized);
		}
	}

	function markAnnotation(annotation, fromSaved) {
		const range = fromSaved ? findTextRange(article, annotation.selectedText) : state.range;
		if (!range) return false;
		return wrapRangeWithMarks(range, annotation);
	}

	function wrapRangeWithMarks(range, annotation) {
		const nodes = getTextNodesInRange(range);
		if (nodes.length === 0) return false;

		for (const item of nodes.reverse()) {
			const mark = createMark(annotation);
			const segmentRange = document.createRange();
			try {
				segmentRange.setStart(item.node, item.start);
				segmentRange.setEnd(item.node, item.end);
				segmentRange.surroundContents(mark);
			} catch (_error) {
				continue;
			}
		}

		return true;
	}

	function getTextNodesInRange(range) {
		const walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT, {
			acceptNode(node) {
				if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
				if (node.parentElement && node.parentElement.closest(".annotation-inline-disclosure")) {
					return NodeFilter.FILTER_REJECT;
				}
				try {
					return range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
				} catch (_error) {
					return NodeFilter.FILTER_REJECT;
				}
			}
		});
		const nodes = [];
		while (walker.nextNode()) {
			const node = walker.currentNode;
			const length = node.nodeValue ? node.nodeValue.length : 0;
			let start = node === range.startContainer ? range.startOffset : 0;
			let end = node === range.endContainer ? range.endOffset : length;
			start = Math.max(0, Math.min(start, length));
			end = Math.max(0, Math.min(end, length));
			if (start < end) {
				nodes.push({ node, start, end });
			}
		}
		return nodes;
	}

	function createMark(annotation) {
		const mark = document.createElement("mark");
		mark.className = "annotation-mark";
		mark.dataset.annotationId = annotation.id;
		if (annotation.note) mark.title = annotation.note;
		mark.addEventListener("click", () => {
			if (usesInlineAnnotations()) {
				toggleInlineAnnotation(annotation.id);
				return;
			}
			openAnnotationEditor(annotation.id);
		});
		mark.addEventListener("contextmenu", (event) => {
			event.preventDefault();
			removeAnnotation(annotation);
		});
		return mark;
	}

	function usesInlineAnnotations() {
		return window.matchMedia("(max-width: 1023px)").matches;
	}

	function findTextRange(root, quote) {
		const needle = compactText(quote);
		if (!needle) return null;

		const map = [];
		let normalized = "";
		let lastWasSpace = false;
		const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);

		while (walker.nextNode()) {
			const node = walker.currentNode;
			if (node.parentElement && node.parentElement.closest(".annotation-inline-disclosure")) {
				continue;
			}
			const value = node.nodeValue || "";
			for (let index = 0; index < value.length; index += 1) {
				const character = value[index];
				if (/\\s/.test(character)) {
					if (!lastWasSpace) {
						normalized += " ";
						map.push({ node, offset: index });
						lastWasSpace = true;
					}
				} else {
					normalized += character;
					map.push({ node, offset: index });
					lastWasSpace = false;
				}
			}
		}

		const startIndex = normalized.indexOf(needle);
		if (startIndex < 0) return null;
		const endIndex = startIndex + needle.length - 1;
		const startPoint = map[startIndex];
		const endPoint = map[endIndex];
		if (!startPoint || !endPoint) return null;

		const range = document.createRange();
		range.setStart(startPoint.node, startPoint.offset);
		range.setEnd(endPoint.node, endPoint.offset + 1);
		return range;
	}

	function renderAnnotationCard(annotation, index, marked) {
		const list = panel.querySelector(".annotation-list");
		if (!list) return;

		const card = document.createElement("div");
		card.tabIndex = 0;
		card.className = "annotation-card";
		card.classList.toggle("has-note", Boolean(annotation.note));
		card.dataset.annotationId = annotation.id;
		card.addEventListener("click", (event) => {
			const target = event.target;
			if (target instanceof Element && target.closest("textarea, button")) return;
			openAnnotationEditor(annotation.id);
		});
		card.addEventListener("keydown", (event) => {
			const target = event.target;
			if (target instanceof Element && target.closest("textarea, button")) return;
			if (event.key === "Enter" || event.key === " ") {
				event.preventDefault();
				openAnnotationEditor(annotation.id);
			}
		});
		card.addEventListener("contextmenu", (event) => {
			event.preventDefault();
			removeAnnotation(annotation);
		});

		const number = document.createElement("span");
		number.className = "annotation-number";
		number.textContent = String(index);

		const quote = document.createElement("p");
		quote.className = "annotation-quote";
		quote.textContent = annotation.selectedText;

		const body = document.createElement("div");
		body.className = "annotation-card-body";

		const note = document.createElement("p");
		note.className = "annotation-note";
		note.textContent = annotation.note;
		note.hidden = !annotation.note;

		const editor = document.createElement("div");
		editor.className = "annotation-card-editor";
		editor.hidden = true;

		const textarea = document.createElement("textarea");
		textarea.rows = 3;
		textarea.placeholder = text.annotationCardPlaceholder;
		textarea.setAttribute("aria-label", text.annotationCardPlaceholder);
		textarea.value = annotation.note;

		const save = document.createElement("button");
		save.type = "button";
		save.className = "annotation-card-save";
		save.textContent = text.annotationComposerSave;
		save.addEventListener("click", () => {
			annotation.note = compactText(textarea.value);
			note.textContent = annotation.note;
			note.hidden = !annotation.note;
			card.classList.toggle("has-note", Boolean(annotation.note));
			syncAnnotation(annotation);
			updateMarkTitles(annotation);
			editor.hidden = true;
			card.classList.remove("is-editing");
			scheduleAnnotationLayout();
		});

		const remove = document.createElement("button");
		remove.type = "button";
		remove.className = "annotation-card-delete";
		remove.textContent = text.annotationDelete;
		remove.addEventListener("click", () => removeAnnotation(annotation));

		const actions = document.createElement("div");
		actions.className = "annotation-card-actions";
		actions.append(remove, save);

		textarea.addEventListener("keydown", (event) => {
			if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
				event.preventDefault();
				save.click();
			}
			if (event.key === "Escape") {
				event.preventDefault();
				cancelAnnotationEditors();
			}
		});

		editor.append(textarea, actions);
		body.append(number, quote, note, editor);
		card.append(body);

		if ((!config.syncAnnotationsToSource || !annotation.sourcePath) && !marked) {
			const status = document.createElement("div");
			status.className = "annotation-status";
			status.textContent = text.annotationSyncDisabled;
			body.append(status);
		}

		list.append(card);
	}

	function renderInlineAnnotation(annotation, index, marked) {
		if (!marked || !annotation.note) return;
		if (
			document.querySelector(
				'.annotation-inline-disclosure[data-annotation-id="' + cssEscape(annotation.id) + '"]'
			)
		) {
			return;
		}
		const marks = Array.from(
			document.querySelectorAll('.annotation-mark[data-annotation-id="' + cssEscape(annotation.id) + '"]')
		);
		const lastMark = marks[marks.length - 1];
		if (!lastMark) return;

		const disclosure = document.createElement("span");
		disclosure.className = "annotation-inline-disclosure";
		disclosure.dataset.annotationId = annotation.id;

		const trigger = document.createElement("button");
		trigger.type = "button";
		trigger.className = "annotation-inline-trigger";
		trigger.setAttribute("aria-expanded", "false");
		trigger.setAttribute("aria-label", text.annotationPanelTitle + " " + index);

		const icon = document.createElement("span");
		icon.className = "annotation-inline-icon";
		icon.setAttribute("aria-hidden", "true");

		const count = document.createElement("span");
		count.className = "annotation-inline-count";
		count.textContent = String(index);

		const content = document.createElement("span");
		content.className = "annotation-inline-content";
		content.hidden = true;

		const note = document.createElement("span");
		note.className = "annotation-inline-note";
		note.textContent = annotation.note;
		content.append(note);

		trigger.append(icon, count);
		trigger.addEventListener("click", (event) => {
			event.preventDefault();
			toggleInlineAnnotation(annotation.id);
		});
		disclosure.append(trigger, content);

		const paragraphEnd = findParagraphEnd(lastMark);
		if (paragraphEnd && paragraphEnd.node) {
			const range = document.createRange();
			range.setStart(paragraphEnd.node, paragraphEnd.offset);
			range.collapse(true);
			range.insertNode(disclosure);
			return;
		}

		lastMark.insertAdjacentElement("afterend", disclosure);
	}

	function findParagraphEnd(lastMark) {
		const block = lastMark.closest("p, li, blockquote");
		if (!block) return null;

		const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, {
			acceptNode(node) {
				return node.parentElement && node.parentElement.closest(".annotation-inline-disclosure")
					? NodeFilter.FILTER_REJECT
					: NodeFilter.FILTER_ACCEPT;
			}
		});
		const nodes = [];
		while (walker.nextNode()) {
			nodes.push(walker.currentNode);
		}

		const lastNode = nodes[nodes.length - 1];
		if (!lastNode || !lastNode.nodeValue) return null;
		return {
			node: lastNode,
			offset: lastNode.nodeValue.length
		};
	}

	function toggleInlineAnnotation(annotationId) {
		const disclosure = document.querySelector(
			'.annotation-inline-disclosure[data-annotation-id="' + cssEscape(annotationId) + '"]'
		);
		if (!disclosure) return;
		const content = disclosure.querySelector(".annotation-inline-content");
		const trigger = disclosure.querySelector(".annotation-inline-trigger");
		if (!content || !trigger) return;

		const shouldOpen = content.hidden;
		closeInlineAnnotations(disclosure);
		content.hidden = !shouldOpen;
		trigger.setAttribute("aria-expanded", String(shouldOpen));
		if (shouldOpen) {
			activateAnnotation(annotationId, false);
		}
	}

	function closeInlineAnnotations(exceptDisclosure) {
		document.querySelectorAll(".annotation-inline-content:not([hidden])").forEach((content) => {
			const disclosure = content.closest(".annotation-inline-disclosure");
			if (disclosure === exceptDisclosure) return;
			content.hidden = true;
			const trigger = disclosure ? disclosure.querySelector(".annotation-inline-trigger") : null;
			if (trigger) trigger.setAttribute("aria-expanded", "false");
		});
	}

	function removeAnnotation(annotation) {
		hidePopover();
		removeAnnotationMarks(annotation.id);
		state.annotations = state.annotations.filter((item) => item.id !== annotation.id);
		document
			.querySelectorAll('.annotation-inline-disclosure[data-annotation-id="' + cssEscape(annotation.id) + '"]')
			.forEach((disclosure) => disclosure.remove());
		const card = panel.querySelector('.annotation-card[data-annotation-id="' + cssEscape(annotation.id) + '"]');
		if (card) card.remove();
		updateAnnotationNumbers();
		updatePanelVisibility();
		syncAnnotationDeletion(annotation);
		scheduleAnnotationLayout();
	}

	function removeAnnotationMarks(annotationId) {
		document
			.querySelectorAll('.annotation-mark[data-annotation-id="' + cssEscape(annotationId) + '"]')
			.forEach((mark) => {
				const parent = mark.parentNode;
				mark.replaceWith(...Array.from(mark.childNodes));
				if (parent && typeof parent.normalize === "function") {
					parent.normalize();
				}
			});
	}

	function syncAnnotation(annotation) {
		if (!config.syncAnnotationsToSource || !annotation.sourcePath || !window.parent || window.parent === window) {
			return;
		}

		window.parent.postMessage(
			{
				plugin: "notes-to-html-pages",
				type: "annotation-created",
				annotation
			},
			"*"
		);
	}

	function syncAnnotationDeletion(annotation) {
		if (!config.syncAnnotationsToSource || !annotation.sourcePath || !window.parent || window.parent === window) {
			return;
		}

		window.parent.postMessage(
			{
				plugin: "notes-to-html-pages",
				type: "annotation-deleted",
				annotationId: annotation.id,
				sourcePath: annotation.sourcePath
			},
			"*"
		);
	}

	function scheduleAnnotationLayout() {
		window.requestAnimationFrame(positionAnnotationCards);
	}

	function positionAnnotationCards() {
		const cards = Array.from(panel.querySelectorAll(".annotation-card"));
		if (window.innerWidth < 1024) {
			cards.forEach((card) => {
				card.style.top = "";
			});
			const list = panel.querySelector(".annotation-list");
			if (list) list.style.height = "";
			return;
		}

		const list = panel.querySelector(".annotation-list");
		if (!list) return;
		const cardsWithAnchors = cards
			.map((card) => {
				const id = card.dataset.annotationId || "";
				const mark = document.querySelector('.annotation-mark[data-annotation-id="' + cssEscape(id) + '"]');
				const fallbackTop = article.getBoundingClientRect().top + window.scrollY;
				const anchorTop = mark
					? mark.getBoundingClientRect().top + window.scrollY + 12
					: Number(card.dataset.annotationTop || fallbackTop);
				card.dataset.annotationTop = String(anchorTop);
				return { card, anchorTop };
			})
			.sort((first, second) => first.anchorTop - second.anchorTop);

		let nextTop = 0;
		for (const item of cardsWithAnchors) {
			const top = Math.max(item.anchorTop, nextTop);
			item.card.style.top = Math.round(top) + "px";
			nextTop = top + item.card.offsetHeight + 10;
		}
		list.style.height = Math.ceil(nextTop) + "px";
	}

	function updateMarkTitles(annotation) {
		document
			.querySelectorAll('.annotation-mark[data-annotation-id="' + cssEscape(annotation.id) + '"]')
			.forEach((mark) => {
				if (annotation.note) {
					mark.setAttribute("title", annotation.note);
				} else {
					mark.removeAttribute("title");
				}
			});
		syncInlineAnnotation(annotation);
	}

	function syncInlineAnnotation(annotation) {
		const selector =
			'.annotation-inline-disclosure[data-annotation-id="' + cssEscape(annotation.id) + '"]';
		const disclosure = document.querySelector(selector);
		if (!annotation.note) {
			if (disclosure) disclosure.remove();
			return;
		}

		if (!disclosure) {
			const index = state.annotations.findIndex((item) => item.id === annotation.id);
			const hasMark = Boolean(
				document.querySelector('.annotation-mark[data-annotation-id="' + cssEscape(annotation.id) + '"]')
			);
			renderInlineAnnotation(annotation, index + 1, hasMark);
			return;
		}

		const inlineNote = disclosure.querySelector(".annotation-inline-note");
		if (inlineNote) inlineNote.textContent = annotation.note;
	}

	function updateAnnotationNumbers() {
		state.annotations.forEach((annotation, index) => {
			const number = panel.querySelector(
				'.annotation-card[data-annotation-id="' + cssEscape(annotation.id) + '"] .annotation-number'
			);
			if (number) number.textContent = String(index + 1);
			const count = document.querySelector(
				'.annotation-inline-disclosure[data-annotation-id="' + cssEscape(annotation.id) + '"] .annotation-inline-count'
			);
			if (count) count.textContent = String(index + 1);
		});
	}

	function activateAnnotation(id, shouldScroll = true) {
		const marks = document.querySelectorAll('.annotation-mark[data-annotation-id="' + cssEscape(id) + '"]');
		document.querySelectorAll(".annotation-card.is-active, .annotation-mark.is-active").forEach((element) => {
			element.classList.remove("is-active");
		});
		const card = document.querySelector('.annotation-card[data-annotation-id="' + cssEscape(id) + '"]');
		if (card) card.classList.add("is-active");
		marks.forEach((mark) => mark.classList.add("is-active"));
		const firstMark = marks[0];
		if (shouldScroll && firstMark) {
			firstMark.scrollIntoView({ block: "center", behavior: "smooth" });
		}
	}

	function openAnnotationEditor(id) {
		const card = document.querySelector('.annotation-card[data-annotation-id="' + cssEscape(id) + '"]');
		if (!card) return;
		activateAnnotation(id, false);
		cancelAnnotationEditors(card);
		const editor = card.querySelector(".annotation-card-editor");
		const textarea = card.querySelector("textarea");
		if (editor) editor.hidden = false;
		card.classList.add("is-editing");
		if (textarea) {
			textarea.focus({ preventScroll: true });
			textarea.setSelectionRange(textarea.value.length, textarea.value.length);
		}
		scheduleAnnotationLayout();
	}

	function cancelAnnotationEditors(exceptCard) {
		let changed = false;
		panel.querySelectorAll(".annotation-card.is-editing").forEach((card) => {
			if (card === exceptCard) return;
			const editor = card.querySelector(".annotation-card-editor");
			const textarea = card.querySelector("textarea");
			const note = card.querySelector(".annotation-note");
			if (textarea) {
				textarea.value = note && !note.hidden ? note.textContent || "" : "";
			}
			if (editor) editor.hidden = true;
			card.classList.remove("is-editing");
			changed = true;
		});
		if (changed) scheduleAnnotationLayout();
	}

	function updatePanelVisibility() {
		panel.hidden = state.annotations.length === 0;
	}

	function compactText(value) {
		return String(value || "").replace(/\\s+/g, " ").trim();
	}

	function formatDate(value) {
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return value;
		const pad = (part) => String(part).padStart(2, "0");
		return pad(date.getMonth() + 1) + "-" + pad(date.getDate()) + " " + pad(date.getHours()) + ":" + pad(date.getMinutes());
	}

	function cssEscape(value) {
		if (window.CSS && typeof window.CSS.escape === "function") {
			return window.CSS.escape(value);
		}
		return String(value).replace(/"/g, "\\\\22 ");
	}

	function isAnnotation(value) {
		return (
			value &&
			typeof value === "object" &&
			typeof value.id === "string" &&
			typeof value.selectedText === "string"
		);
	}
})();
`.trim();

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
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
}

body {
	position: relative;
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
	text-wrap: balance;
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
	text-wrap: pretty;
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
	text-wrap: balance;
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

[hidden] {
	display: none !important;
}

.annotation-mark {
	margin: 0 0.01em;
	padding: 0.02em 0.08em 0.03em;
	border-bottom: 1px solid rgba(199, 53, 43, 0.34);
	background: rgba(199, 53, 43, 0.1);
	cursor: pointer;
	transition: background-color 160ms ease, box-shadow 160ms ease;
}

.annotation-mark:hover,
.annotation-mark.is-active {
	background: rgba(199, 53, 43, 0.16);
	box-shadow: 0 0 0 2px rgba(199, 53, 43, 0.08);
}

.annotation-inline-disclosure {
	display: none;
}

.annotation-popover {
	position: absolute;
	z-index: 30;
	width: min(20rem, calc(100vw - 1.75rem));
	padding: 0.5rem;
	border: 1px solid rgba(92, 75, 56, 0.16);
	border-radius: 10px;
	background: rgba(255, 252, 246, 0.98);
	box-shadow: 0 12px 30px rgba(60, 45, 30, 0.14);
	backdrop-filter: blur(10px);
}

.annotation-popover::before {
	content: "";
	position: absolute;
	top: -6px;
	left: 1.2rem;
	width: 10px;
	height: 10px;
	border-top: 1px solid rgba(92, 75, 56, 0.16);
	border-left: 1px solid rgba(92, 75, 56, 0.16);
	background: rgba(255, 252, 246, 0.98);
	transform: rotate(45deg);
}

.annotation-popover-actions {
	display: flex;
	align-items: center;
	margin-bottom: 0.42rem;
}

.annotation-popover button,
.annotation-card button {
	appearance: none;
	border: 0;
	border-radius: 5px;
	background: transparent;
	color: var(--ink);
	font: inherit;
	font-size: 0.78rem;
	line-height: 1;
	cursor: pointer;
}

.annotation-underline-button {
	width: 100%;
	padding: 0.5rem 0.68rem;
	border: 1px solid rgba(199, 53, 43, 0.18) !important;
	background: rgba(199, 53, 43, 0.08) !important;
	color: var(--accent) !important;
	font-weight: 700 !important;
	text-align: center;
}

.annotation-popover button:hover,
.annotation-popover button:focus-visible,
.annotation-card button:hover,
.annotation-card button:focus-visible {
	background: var(--accent-soft);
	color: var(--accent);
	outline: none;
}

.annotation-note-row {
	display: grid;
	grid-template-columns: minmax(0, 1fr) auto;
	gap: 0.4rem;
	align-items: center;
	padding: 0.28rem;
	border: 1px solid rgba(216, 209, 198, 0.9);
	border-radius: 8px;
	background: rgba(251, 248, 241, 0.92);
}

.annotation-note-input {
	width: 100%;
	min-width: 0;
	padding: 0.46rem 0.5rem;
	border: 0;
	border-radius: 6px;
	background: transparent;
	color: var(--ink);
	font: inherit;
	font-size: 0.8rem;
	line-height: 1.2;
}

.annotation-note-row:focus-within {
	border-color: rgba(199, 53, 43, 0.44);
	box-shadow: 0 0 0 2px rgba(199, 53, 43, 0.08);
}

.annotation-note-input:focus {
	outline: none;
}

.annotation-card textarea:focus {
	border-color: rgba(199, 53, 43, 0.52);
	outline: 2px solid rgba(199, 53, 43, 0.12);
}

.annotation-mini-save,
.annotation-card-save {
	padding: 0.42rem 0.58rem;
	border-radius: 6px !important;
	background: var(--accent) !important;
	color: #fff !important;
}

.annotation-panel {
	position: absolute;
	top: 0;
	right: max(1.25rem, calc(50% - 360px - 17rem));
	width: 15.8rem;
	z-index: 20;
	padding-left: 0.8rem;
	border-left: 1px solid var(--line-soft);
	overflow: visible;
}

.annotation-panel-title {
	display: none;
}

.annotation-list {
	position: relative;
	width: 100%;
}

.annotation-card {
	position: absolute;
	left: 0;
	width: 100%;
	padding: 0;
	border: 0;
	border-radius: 10px;
	background: transparent;
	color: var(--ink);
	font: inherit;
	text-align: left;
	box-shadow: none;
	cursor: pointer;
	transition-property: background-color, box-shadow;
	transition-duration: 180ms;
	transition-timing-function: ease-out;
}

.annotation-card:hover,
.annotation-card.is-active {
	background: transparent;
	box-shadow: none;
}

.annotation-card.is-editing {
	background: transparent;
	box-shadow: none;
}

.annotation-card-body {
	position: relative;
	padding: 0.18rem 0.5rem 0.42rem 1.55rem;
}

.annotation-number {
	position: absolute;
	top: 0.18rem;
	left: 0.12rem;
	min-width: 1rem;
	color: var(--accent);
	font-size: 0.88rem;
	font-weight: 700;
	font-variant-numeric: tabular-nums;
}

.annotation-quote,
.annotation-status {
	margin: 0;
}

.annotation-quote {
	margin: 0;
	color: #625d54;
	font-size: 0.78rem;
	line-height: 1.46;
	border-left: 2px solid rgba(199, 53, 43, 0.34);
	background: rgba(199, 53, 43, 0.045);
	padding: 0.36rem 0.48rem;
	text-wrap: pretty;
}

.annotation-note {
	margin: 0.62rem 0 0;
	padding: 0;
	border: 0;
	color: var(--ink);
	font-size: 0.86rem;
	line-height: 1.52;
	text-wrap: pretty;
}

.annotation-status {
	margin-top: 0.45rem;
	color: var(--muted);
	font-size: 0.7rem;
}

.annotation-card-editor {
	display: grid;
	gap: 0.42rem;
	margin-top: 0.86rem;
	padding-top: 0.74rem;
	border-top: 1px solid var(--line-soft);
}

.annotation-card textarea {
	display: block;
	width: 100%;
	resize: vertical;
	min-height: 4.5rem;
	padding: 0.58rem 0.62rem;
	border: 1px solid var(--line);
	border-radius: 6px;
	background: var(--paper);
	color: var(--ink);
	font: inherit;
	font-size: 0.78rem;
	line-height: 1.48;
}

.annotation-card-save {
	font-size: 0.72rem !important;
}

.annotation-card-actions {
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 0.38rem;
	margin-top: 0.06rem;
}

.annotation-card-delete,
.annotation-card-save {
	min-width: auto;
	min-height: 2.1rem;
	padding: 0.36rem 0.58rem !important;
	font-size: 0.72rem !important;
	transition-property: background-color, border-color, box-shadow, color, scale;
	transition-duration: 150ms;
	transition-timing-function: ease-out;
}

.annotation-card-delete {
	border-color: transparent !important;
	background: transparent !important;
	color: var(--accent) !important;
	box-shadow: none !important;
}

.annotation-card .annotation-card-delete:hover,
.annotation-card .annotation-card-delete:focus-visible {
	background: rgba(199, 53, 43, 0.075) !important;
	color: var(--accent) !important;
	box-shadow: none !important;
	outline: none;
}

.annotation-card .annotation-card-save:hover,
.annotation-card .annotation-card-save:focus-visible {
	background: #ae2e26 !important;
	box-shadow: 0 2px 5px rgba(152, 43, 35, 0.22) !important;
	outline: none;
}

.annotation-card-delete:active,
.annotation-card-save:active {
	scale: 0.96;
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
	outline: 1px solid rgba(0, 0, 0, 0.1);
	outline-offset: -1px;
}

sup {
	line-height: 0;
}

@media (min-width: 1280px) {
	.side-table-of-contents {
		display: block;
		position: fixed;
		top: 5rem;
		left: max(1.25rem, calc(50% - 360px - 14.5rem));
		right: auto;
		width: 12.75rem;
		max-height: calc(100vh - 6rem);
		padding: 0.2rem 0.75rem 0.5rem 0;
		border-right: 1px solid var(--line-soft);
		border-left: 0;
		background: transparent;
		overflow: auto;
	}
}

@media (min-width: 1024px) and (max-width: 1179px) {
	.article-body {
		max-width: 640px;
	}

	.annotation-panel {
		right: max(1rem, calc(50% - 320px - 11.5rem));
		width: 10.5rem;
		padding-left: 0.58rem;
	}

	.annotation-card-body {
		padding-right: 0.25rem;
		padding-left: 1.28rem;
	}

	.annotation-number {
		left: 0.06rem;
		font-size: 0.78rem;
	}

	.annotation-quote {
		font-size: 0.72rem;
	}

	.annotation-note {
		font-size: 0.8rem;
	}
}

@media (min-width: 1180px) and (max-width: 1359px) {
	.article-body {
		max-width: 680px;
	}

	.annotation-panel {
		right: max(1rem, calc(50% - 340px - 13.5rem));
		width: 12.5rem;
		padding-left: 0.68rem;
	}
}

@media (max-width: 1023px) {
	.annotation-panel {
		display: none !important;
	}

	.annotation-popover {
		width: min(22rem, calc(100vw - 1.5rem));
	}

	.annotation-inline-disclosure {
		display: inline;
		margin-left: 0.22em;
		vertical-align: baseline;
	}

	.annotation-inline-trigger {
		display: inline-flex;
		align-items: center;
		gap: 0.24rem;
		min-height: 1.3rem;
		padding: 0.12rem 0.28rem;
		border: 0;
		border-radius: 4px;
		background: rgba(92, 75, 56, 0.055);
		color: var(--muted);
		font: inherit;
		font-size: 0.64rem;
		font-variant-numeric: tabular-nums;
		line-height: 1;
		vertical-align: 0.08em;
		cursor: pointer;
		transition-property: background-color, color, scale;
		transition-duration: 150ms;
		transition-timing-function: ease-out;
	}

	.annotation-inline-trigger:hover,
	.annotation-inline-trigger:focus-visible,
	.annotation-inline-trigger[aria-expanded="true"] {
		background: rgba(199, 53, 43, 0.09);
		color: var(--accent);
		outline: none;
	}

	.annotation-inline-trigger:active {
		scale: 0.96;
	}

	.annotation-inline-icon {
		position: relative;
		display: inline-block;
		width: 0.62rem;
		height: 0.48rem;
		border: 1px solid currentColor;
		border-radius: 2px;
	}

	.annotation-inline-icon::after {
		content: "";
		position: absolute;
		bottom: -0.17rem;
		left: 0.12rem;
		width: 0.2rem;
		height: 0.2rem;
		border-bottom: 1px solid currentColor;
		border-left: 1px solid currentColor;
		background: transparent;
		transform: skewY(-36deg);
	}

	.annotation-inline-content {
		margin-left: 0.3em;
		padding: 0.08em 0.34em 0.1em;
		border-left: 1px solid rgba(199, 53, 43, 0.3);
		background: rgba(199, 53, 43, 0.038);
		color: var(--ink);
		font-size: 0.78rem;
		line-height: 1.52;
		text-wrap: pretty;
		vertical-align: baseline;
	}

	.annotation-inline-note {
		margin: 0;
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

	.annotation-popover {
		max-width: calc(100vw - 1.5rem);
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

	.annotation-popover,
	.annotation-panel {
		display: none !important;
	}
}
`.trim();
