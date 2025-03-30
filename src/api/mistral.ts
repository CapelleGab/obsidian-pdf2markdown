import { Mistral } from "@mistralai/mistralai";
import { FilePurpose } from "@mistralai/mistralai/models/components";

export const buildPDFToMardown = async (file: File, apiKey: string) => {
	const client = new Mistral({ apiKey: apiKey });

	const uploadedPdf = await client.files.upload({
		file: {
			fileName: file.name,
			content: file,
		},
		purpose: "ocr" as FilePurpose,
	});

	const signedUrl = await client.files.getSignedUrl({
		fileId: uploadedPdf.id,
	});

	return await client.ocr.process({
		model: "mistral-ocr-latest",
		document: {
			type: "document_url",
			documentUrl: signedUrl.url,
		},
		includeImageBase64: true,
	});
};
