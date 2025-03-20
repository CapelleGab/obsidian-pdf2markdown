import PDFtoMD from "main";
import { App, Modal, Notice } from "obsidian";
import {
	getJsonFromSignedUrl,
	getSignedUrl,
	uploadPDFtoMistral,
} from "../utils/ocrRequest";
import { addApiKey } from "./addApiKey.modal";

export class pdfToMdModal extends Modal {
	private plugin: PDFtoMD;
	constructor(app: App, plugin: PDFtoMD) {
		super(app);
		this.plugin = plugin;
	}

	async onOpen() {
		const { contentEl } = this;

		if (this.plugin.settings.apiKey === "") {
			new addApiKey(this.app, this.plugin).open();
			this.close();
		}

		contentEl.createEl("h2", {
			text: "PDF To Markdown",
			cls: "pdf-upload-title",
		});

		const container = contentEl.createDiv({ cls: "pdf-upload-container" });

		const inputContainer = container.createDiv({
			cls: "pdf-input-container",
		});

		const pdfInput = inputContainer.createEl("input", {
			attr: {
				type: "text",
				id: "pdf-upload",
				placeholder: "Sélectionner un PDF...",
				readonly: "true",
			},
			cls: "pdf-upload-input",
		});

		const fileInput = inputContainer.createEl("input", {
			attr: {
				type: "file",
				accept: "application/pdf",
				hidden: "true",
			},
		});

		const folderInput = inputContainer.createEl("input", {
			attr: {
				type: "text",
				id: "folder-upload",
				value: this.plugin.settings.defaultFolder,
				placeholder: this.plugin.settings.defaultFolder,
				readonly: "true",
			},
			cls: "folder-upload-input",
		});

		pdfInput.addEventListener("click", () => fileInput.click());

		fileInput.addEventListener("change", (event) => {
			const file = (event.target as HTMLInputElement).files?.[0];
			if (file) {
				pdfInput.value = file.name;
			}
		});

		folderInput.addEventListener("click", async () => {
			const folderPath = await this.openFolderDialog();
			if (folderPath) {
				folderInput.value = folderPath;
			}
		});

		const submitButton = container.createEl("button", {
			text: "Convertir PDF",
			cls: "pdf-upload-button",
		});

		submitButton.addEventListener("click", async () => {
			const file = fileInput.files?.[0];
			const folderPath = folderInput.value;
			if (!file) {
				new Notice("Veuillez sélectionner un fichier PDF.");
				return;
			}
			if (!folderPath) {
				new Notice("Veuillez entrer un dossier de destination.");
				return;
			}

			try {
				const jsonContent = await this.getJsonFromPDF(file);

				console.log(jsonContent);

				let pageContent = "";
				jsonContent.pages.forEach((page) => {
					pageContent += `${page.markdown} `;
				});

				await this.createMarkdownFile(pageContent, file, folderPath);
				new Notice("Conversion réussie !");
				this.close();
			} catch (error) {
				console.error("Erreur lors de la conversion :", error);
				new Notice(
					`La conversion a échoué. Détails de l'erreur : ${error}`
				);
			}
		});
	}

	async openFolderDialog(): Promise<string | null> {
		return new Promise((resolve) => {
			const dialog = window.require("electron").remote.dialog;

			dialog
				.showOpenDialog({
					properties: ["openDirectory"],
				})
				.then((result: any) => {
					console.log(typeof result);
					if (result.canceled) {
						resolve(null);
					} else {
						resolve(result.filePaths[0]);
					}
				})
				.catch((err: Error) => {
					console.error(
						"Erreur lors de l'ouverture du dialogue :",
						err
					);
					resolve(null);
				});
		});
	}

	async createMarkdownFile(content: string, file: File, folderPath: string) {
		const fileName = `${file.name.replace(/\.pdf$/, "")}.md`;
		const vaultRoot = this.app.vault.adapter.basePath;
		const relativeFolderPath = folderPath
			.replace(vaultRoot, "")
			.replace(/^\/+/, "");
		const fullPath = relativeFolderPath + "/" + fileName;
		const folderExists = await this.app.vault.adapter.exists(
			relativeFolderPath
		);

		if (!folderExists) {
			// Si le dossier n'existe pas, on l'ajoute au dossier par défaut en setting
			try {
				await this.app.vault.createFolder(relativeFolderPath);
			} catch (error) {
				console.error("Erreur lors de la création du dossier :", error);
				new Notice(`Erreur lors de la création du dossier : ${error}`);
				return;
			}
		}

		try {
			// Créer le fichier Markdown
			const createdFile = await this.app.vault.create(fullPath, content);
			this.app.workspace.openLinkText(createdFile.path, "", true);
		} catch (error) {
			console.error(
				"Erreur lors de la création du fichier Markdown :",
				error
			);
			new Notice(
				`Erreur lors de la création du fichier. Détails : ${error}`
			);
		}
	}

	async getJsonFromPDF(file: File) {
		const uploadedPdf = await uploadPDFtoMistral(file);
		const signedUrl = await getSignedUrl(uploadedPdf);
		return await getJsonFromSignedUrl(signedUrl);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
