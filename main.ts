import { Menu, MenuItem, Notice, Plugin, TFile } from "obsidian";
import { PDFtoMDSettings, PDFtoMDSettingTab } from "src/configs/settings";
// Modal
import { pdfToMdModal } from "src/modals/pdfToMD.modal";
// Services
import { ConfigService } from "./src/services/ConfigService";
import { FileService } from "./src/services/FileService";
import { StyleService } from "./src/services/StyleService";

export default class PDFtoMD extends Plugin {
	settings: PDFtoMDSettings;
	private styleService: StyleService;
	private fileService: FileService;
	private configService: ConfigService;

	async onload() {
		// Initialize services
		this.styleService = new StyleService(this.app);
		this.fileService = new FileService(this.app);
		this.configService = new ConfigService(this.app, this);

		await this.configService.loadSettings();
		this.settings = this.configService.getSettings();
		this.styleService.loadStyles();

		if (this.settings.showNotice) {
			new Notice("PDF To MD - Loaded");
		}
		// Add ribbon icon
		this.addRibbonIcon(
			"arrow-right-left",
			"PDF2Markdown",
			(evt: MouseEvent) => {
				new pdfToMdModal(this.app, this).open();
			}
		);

		// Add command to trigger modal
		this.addCommand({
			id: "obsidian-pdf2markdown",
			name: "Convert PDF To Markdown",
			callback: () => {
				new pdfToMdModal(this.app, this).open();
			},
		});

		// Add setting tab for plugin settings
		this.addSettingTab(new PDFtoMDSettingTab(this.app, this));

		// Register right-click menu for PDF files

		this.registerEvent(
			this.app.workspace.on("file-menu", (menu: Menu, file: TFile) => {
				if (file.extension === "pdf") {
					menu.addItem((item: MenuItem) => {
						item.setTitle("PDF2Markdown");
						const submenu = item.setSubmenu();

						submenu.addItem((item) => {
							item
								.setTitle("📄 Extract file into a new note")
								.onClick(async () => {
									const fileBlob = await this.fileService.getBlobFromFile(file);
									if (!fileBlob) {
										new Notice("Impossible de lire le fichier PDF.");
										return;
									}
									const newFile = new File([fileBlob], file.name, {
										type: "application/pdf",
									});
									new pdfToMdModal(this.app, this, newFile).open();
								});
						});
						submenu.addItem((item) => {
							item
								.setTitle("⚡️ Extract fast in default folder")
								.onClick(async () => {
									// Handle the case where you extract directly without going through the modal
								});
						});
					});
				}
			})
		);
	}

	async loadSettings() {
		await this.configService.loadSettings();
		this.settings = this.configService.getSettings();
	}

	async saveSettings() {
		await this.configService.saveSettings();
	}

	onunload() {
		if (this.settings.showNotice) {
			return new Notice("PDF To MD - Unloaded");
		}
		return;
	}
}
