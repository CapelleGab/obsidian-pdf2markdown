import * as dotenv from "dotenv";
import { Notice, Plugin } from "obsidian";
import {
	DEFAULT_SETTINGS,
	PDFtoMDSettings,
	PDFtoMDSettingTab,
} from "src/configs/settings";
import { pdfToMdModal } from "src/modals/pdfToMD.modal";

dotenv.config({ path: "src/configs/.env" });

export default class PDFtoMD extends Plugin {
	settings: PDFtoMDSettings;

	async onload() {
		// Load
		await this.loadSettings();
		this.loadStyles();

		this.addRibbonIcon(
			"arrow-right-left",
			"PDF to Markdown",
			(evt: MouseEvent) => {
				new pdfToMdModal(this.app, this).open();
			}
		);

		this.addCommand({
			id: "pdf-to-md",
			name: "PDF To Markdown",
			callback: () => {
				new pdfToMdModal(this.app, this).open();
			},
		});

		this.addSettingTab(new PDFtoMDSettingTab(this.app, this));
		this.registerInterval(
			window.setInterval(() => console.log("setInterval"), 5 * 60 * 1000)
		);
	}

	loadStyles() {
		const link = document.createElement("link");
		link.rel = "stylesheet";
		link.href = this.app.vault.adapter.getResourcePath(
			`${this.manifest.dir}/styles.css`
		);
		document.head.appendChild(link);
	}

	onunload() {
		return new Notice("PDF To MD - Unloaded");
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
