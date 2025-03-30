import { App, TFile } from "obsidian";

export class FileService {
	constructor(private app: App) {}

	async getBlobFromFile(file: TFile): Promise<Blob | null> {
		try {
			const data = await this.app.vault.readBinary(file);
			return new Blob([data], { type: "application/pdf" });
		} catch (error) {
			console.error("Erreur lors de la lecture du fichier :", error);
			return null;
		}
	}
}
