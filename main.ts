import { Menu, MenuItem, Notice, Plugin, TFile } from "obsidian";
import {
	DEFAULT_SETTINGS,
	PDFtoMDSettings,
	PDFtoMDSettingTab,
} from "src/configs/settings";
import { pdfToMdModal } from "src/modals/pdfToMD.modal";

export default class PDFtoMD extends Plugin {
	settings: PDFtoMDSettings;

	async onload() {
		// Load settings and styles
		await this.loadSettings();
		this.loadStyles();

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
								const fileBlob = await this.getFileAsBlob(file);
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

	// Method to convert TFile to Blob
	async getFileAsBlob(file: TFile): Promise<Blob | null> {
		try {
			const data = await this.app.vault.readBinary(file);
			return new Blob([data], { type: "application/pdf" });
		} catch (error) {
			console.error("Erreur lors de la lecture du fichier :", error);
			return null;
		}
	}

	// Load styles for plugin
	loadStyles() {
		const link = document.createElement("link");
		link.rel = "stylesheet";
		link.href = this.app.vault.adapter.getResourcePath(
			`${this.manifest.dir}/styles.css`
		);
		document.head.appendChild(link);
	}

	// Unload plugin
	onunload() {
		return new Notice("PDF To MD - Unloaded");
	}

	// Load settings from file
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	// Save settings to file
	async saveSettings() {
		await this.saveData(this.settings);
	}
}
