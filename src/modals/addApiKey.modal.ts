import PDFtoMD from "main";
import { App, Modal } from "obsidian";

export class addApiKey extends Modal {
	private plugin: PDFtoMD;

	constructor(app: App, plugin: PDFtoMD) {
		super(app);
		this.plugin = plugin;
	}

	async onOpen() {
		const { contentEl } = this;

		contentEl.createEl("h2", {
			text: "Put you're Mistral API KEY",
			cls: "api-key-title",
		});

		const container = contentEl.createDiv({ cls: "api-key-container" });

		const apiInput = container.createEl("input", {
			attr: {
				type: "text",
				id: "apikey-set",
				placeholder: "Api key...",
			},
			cls: "api-key-input",
		});

		const submitButton = container.createEl("button", {
			text: "Save Settings",
			cls: "api-key-button",
		});

		submitButton.addEventListener("click", async () => {
			this.plugin.settings.apiKey = apiInput.value;
			this.plugin.saveSettings();

			this.close();
		});
	}

	async onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
