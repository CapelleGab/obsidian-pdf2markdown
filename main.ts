import { Menu, MenuItem, Notice, Plugin, TFile } from "obsidian";
import {
	DEFAULT_SETTINGS,
	PDFtoMDSettings,
	PDFtoMDSettingTab,
} from "src/configs/settings";
import { pdfToMdModal } from "src/modals/pdfToMD.modal";
import { FileService } from "./src/services/FileService";
import { StyleService } from "./src/services/StyleService";

export default class PDFtoMD extends Plugin {
	settings: PDFtoMDSettings;
	private styleService: StyleService;
	private fileService: FileService;

	async onload() {
		// Initialize services
		this.styleService = new StyleService(this.app);
		this.fileService = new FileService(this.app);

		// Load settings and styles
		await this.loadSettings();
		this.styleService.loadStyles();

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
						item
							.setTitle("Extract file into a new note")
							.setIcon("file-text")
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
				}
			})
		);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	// Save settings to file
	async saveSettings() {
		await this.saveData(this.settings);
	}

	onunload() {
		return new Notice("PDF To MD - Unloaded");
	}
}
