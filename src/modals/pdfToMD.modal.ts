import PDFtoMD from "main";
import { App, Modal, Notice, TFile } from "obsidian";
import { buildPDFToMardown } from "src/utils/ocrRequests.utils";
import { addApiKey } from "./addApiKey.modal";

export class pdfToMdModal extends Modal {
	private plugin: PDFtoMD;
	private selectedFile?: File;

	constructor(app: App, plugin: PDFtoMD, selectedFile?: File) {
		super(app);
		this.plugin = plugin;
		this.selectedFile = selectedFile;
	}

	async onOpen() {
		const { contentEl } = this;

		// Check if API key is provided, else ask for it
		if (this.plugin.settings.apiKey === "") {
			new addApiKey(this.app, this.plugin).open();
			this.close();
			return;
		}

		// Modal Header
		contentEl.createEl("h2", {
			text: "PDF To Markdown",
			cls: "pdf-upload-title",
		});

		const container = contentEl.createDiv({ cls: "pdf-upload-container" });

		const inputContainer = container.createDiv({
			cls: "pdf-input-container",
		});

		// PDF Selector
		const pdfInputLabel = inputContainer.createEl("input", {
			attr: {
				type: "text",
				id: "pdf-upload",
				placeholder: "Select any PDF...",
				readonly: "true",
			},
			cls: "pdf-upload-input",
		});
		const pdfSelectorInput = inputContainer.createEl("input", {
			attr: {
				type: "file",
				accept: "application/pdf",
				hidden: "true",
			},
		});
		pdfInputLabel.addEventListener("click", () => pdfSelectorInput.click());

		// Destination Folder Selector (avec Electron dialog)
		const destinationFolderInputLabel = inputContainer.createEl("input", {
			attr: {
				type: "text",
				id: "folder-upload",
				value: this.plugin.settings.defaultFolder,
				placeholder: "Select destination...",
				readonly: "true",
			},
			cls: "folder-upload-input",
		});

		destinationFolderInputLabel.addEventListener("click", async () => {
			const folderPath = await this.openFolderDialog(
				this.plugin.settings.defaultFolder
			);
			if (folderPath) {
				destinationFolderInputLabel.value = folderPath;
			}
		});

		if (this.selectedFile) {
			const dataTransfer = new DataTransfer();
			dataTransfer.items.add(this.selectedFile);
			pdfSelectorInput.files = dataTransfer.files;
			pdfInputLabel.value = this.selectedFile.name;
		}

		pdfSelectorInput.addEventListener("change", (event) => {
			const file = (event.target as HTMLInputElement).files?.[0];
			if (file) {
				pdfInputLabel.value = file.name;
			}
		});

		const submitButton = container.createEl("button", {
			text: "Convertir PDF",
			cls: "pdf-upload-button",
		});

		submitButton.addEventListener("click", async () => {
			const file = pdfSelectorInput.files?.[0];
			const folderPath = destinationFolderInputLabel.value;

			if (!file) {
				new Notice("Veuillez sélectionner un fichier PDF.");
				return;
			}
			if (!folderPath) {
				new Notice("Veuillez entrer un dossier de destination.");
				return;
			}

			try {
				const jsonContent = await this.getJSON(file);

				console.log("JSON CONTENT GOOD");

				let pageContent = "";
				const images: string[] = [];

				jsonContent.pages.forEach((page) => {
					if (page.markdown) {
						pageContent += `${page.markdown}`;
					}

					if (page.images) {
						page.images.forEach((image) => {
							if (image.imageBase64) {
								images.push(image.imageBase64);
							}
						});
					}
				});

				await this.createMarkdownFile(pageContent, file, folderPath, images);

				new Notice("Conversion réussie !");
				this.close();
			} catch (error) {
				new Notice(
					`La conversion a échoué. Détails de l'erreur : ${
						error instanceof Error ? error.message : error
					}`
				);
			}
		});
	}

	async createMarkdownFile(
		content: string,
		file: File,
		folderPath: string,
		images: string[]
	) {
		const fileName = file.name.replace(/\.pdf$/, "");
		const markdownFileName = `${fileName}.md`;
		const vaultRoot = this.app.vault.adapter.basePath;
		const relativeFolderPath = folderPath
			.replace(vaultRoot, "")
			.replace(/^\/+/, "");

		const newFolderPath = relativeFolderPath
			? `${relativeFolderPath}/${fileName}`
			: fileName;

		if (!(await this.app.vault.adapter.exists(newFolderPath))) {
			try {
				await this.app.vault.createFolder(newFolderPath);
			} catch (error) {
				new Notice(`Erreur lors de la création du dossier : ${error}`);
				return;
			}
		}

		const fullPath = `${newFolderPath}/${markdownFileName}`;
		try {
			if (images && images.length > 0) {
				for (let i = 0; i < images.length; i++) {
					const image = images[i];
					const imageFileName = `img-${i}.jpeg`;
					const imagePath = `${newFolderPath}/${imageFileName}`;
					try {
						const base64Data = image.split(",")[1];
						const imageBuffer = Buffer.from(base64Data, "base64");
						await this.app.vault.adapter.writeBinary(imagePath, imageBuffer);
					} catch (error) {
						new Notice(`Erreur lors de la création de l'image : ${error}`);
					}
				}
			}

			await this.app.vault.create(fullPath, content);

			const newFile = this.app.vault.getAbstractFileByPath(fullPath);
			if (newFile instanceof TFile) {
				await this.app.workspace.getLeaf().openFile(newFile);
			}
		} catch (error) {
			new Notice(`Erreur lors de la création du fichier Markdown : ${error}`);
		}
	}

	async getJSON(file: File) {
		return await buildPDFToMardown(file, this.plugin.settings.apiKey);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}

	async openFolderDialog(defaultPath?: string): Promise<string | null> {
		return new Promise((resolve) => {
			try {
				const dialog = window.require("electron").remote.dialog;
				const vaultPath = this.app.vault.adapter.basePath;

				console.log("Chemin du vault:", vaultPath);
				console.log("Chemin par défaut:", defaultPath);

				dialog
					.showOpenDialog({
						properties: ["openDirectory"],
						defaultPath: vaultPath,
						title: "Sélectionner un dossier dans le vault",
					})
					.then((result: { canceled: boolean; filePaths: string[] }) => {
						if (result.canceled) {
							resolve(null);
						} else {
							console.log("Chemin sélectionné:", result.filePaths[0]);
							resolve(result.filePaths[0]);
						}
					})
					.catch((err: Error) => {
						console.error("Erreur lors de l'ouverture du dialogue :", err);
						new Notice("Erreur lors de l'ouverture du sélecteur de dossier");
						resolve(null);
					});
			} catch (err) {
				console.error("Erreur lors de l'initialisation du dialogue :", err);
				new Notice("Impossible d'accéder au sélecteur de dossier");
				resolve(null);
			}
		});
	}
}
