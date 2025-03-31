import { App, Plugin } from "obsidian";
import { DEFAULT_SETTINGS, PDFtoMDSettings } from "../configs/settings";

export class ConfigService {
	private settings: PDFtoMDSettings;
	private plugin: Plugin;

	constructor(private app: App, plugin: Plugin) {
		this.plugin = plugin;
		this.settings = DEFAULT_SETTINGS;
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.plugin.loadData()
		);
	}

	async saveSettings() {
		await this.plugin.saveData(this.settings);
	}

	getSettings(): PDFtoMDSettings {
		return this.settings;
	}

	updateSettings(settings: Partial<PDFtoMDSettings>) {
		this.settings = { ...this.settings, ...settings };
	}
}
