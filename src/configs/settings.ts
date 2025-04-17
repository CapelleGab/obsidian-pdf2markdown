import { App, PluginSettingTab, Setting } from "obsidian";
import PDFtoMD from "../../main";

export interface PDFtoMDSettings {
	defaultFolder: string;
	apiKey: string;
	showNotice: boolean;
}

export const DEFAULT_SETTINGS: PDFtoMDSettings = {
	defaultFolder: "/Conversions/",
	apiKey: "",
	showNotice: true,
};

export class PDFtoMDSettingTab extends PluginSettingTab {
	plugin: PDFtoMD;

	constructor(app: App, plugin: PDFtoMD) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();
		new Setting(containerEl)
			.setName("Default conversion folder").setHeading()
			.setDesc(
				"Select the folder where converted Markdown files will be saved."
			)
			.addText((text) =>
				text
					.setPlaceholder("Enter folder path")
					.setValue(this.plugin.settings.defaultFolder)
					.onChange(async (value) => {
						this.plugin.settings.defaultFolder = value;
						await this.plugin.saveSettings();
					})
			);
		new Setting(containerEl)
			.setName("Mistral API KEY").setHeading()
			.setDesc("Go to Mistral LA PLATFORME to get you're API KEY")
			.addText((text) => {
				text
					.setPlaceholder("API KEY")
					.setValue(this.plugin.settings.apiKey)
					.onChange(async (value) => {
						this.plugin.settings.apiKey = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("Toggle Notice").setHeading()
			.setDesc("Toggle all notice plugin")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.showNotice)
					.onChange(async (value) => {
						this.plugin.settings.showNotice = value;
						await this.plugin.saveSettings();
					});
			});
	}
}
