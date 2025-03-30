import { App } from "obsidian";

export class StyleService {
	constructor(private app: App) {}

	loadStyles() {
		const link = document.createElement("link");
		link.rel = "stylesheet";
		link.href = this.app.vault.adapter.getResourcePath(`styles.css`);
		document.head.appendChild(link);
	}
}
