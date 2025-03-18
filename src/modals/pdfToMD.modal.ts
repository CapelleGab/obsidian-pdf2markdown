import { App, Modal, Notice } from "obsidian";
import {
	getJsonFromSignedUrl,
	getSignedUrl,
	uploadPDFtoMistral,
} from "../utils/ocrRequest";

export class pdfToMdModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;

		contentEl.createEl("h2", {
			text: "PDF To Markdown",
			cls: "pdf-upload-title",
		});
		const container = contentEl.createDiv({ cls: "pdf-upload-container" });
		const label = container.createEl("label", {
			cls: "pdf-upload-label",
			text: "Select a PDF",
			attr: { for: "pdf-upload" },
		});
		const pdfInput = container.createEl("input", {
			attr: {
				type: "file",
				accept: "application/pdf",
				id: "pdf-upload",
			},
			cls: "pdf-upload-input",
		});
		const submitButton = container.createEl("button", {
			text: "Upload PDF",
			cls: "pdf-upload-button",
		});

		pdfInput.addEventListener("change", (event) => {
			const file = (event.target as HTMLInputElement).files?.[0];
			if (file) {
				label.textContent = `📄 ${file.name}`;
			}
		});
		submitButton.addEventListener("click", async () => {
			const file = pdfInput.files?.[0];
			if (!file) {
				new Notice("Please select a PDF file.");
				return;
			}

			try {
				const jsonContent = await this.getJsonFromPDF(file);

				let pageContent = "";
				jsonContent.pages.map((page) => {
					pageContent += `${page.markdown} `;
				});

				this.createMarkdownFile(pageContent, file);
				new Notice("Conversion réussie !");
				this.close();
			} catch (error) {
				console.error("Erreur lors de la conversion :", error);
				new Notice("La conversion a échoué. Veuillez réessayer.");
			}
		});

		container.appendChild(label);
		container.appendChild(pdfInput);
		container.appendChild(submitButton);
	}
	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
	async getJsonFromPDF(file: File) {
		const uploadedPdf = await uploadPDFtoMistral(file);
		const signedUrl = await getSignedUrl(uploadedPdf);
		return await getJsonFromSignedUrl(signedUrl);
	}

	createMarkdownFile(content: string, file: File) {
		const fileName = `${file.name.replace(/\.pdf$/, "")}.md`;
		this.app.vault.create(fileName, content).then((file) => {
			this.app.workspace.openLinkText(fileName, "", true);
		});
	}
}
