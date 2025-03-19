import { Mistral } from "@mistralai/mistralai";
import {
	FileSignedURL,
	UploadFileOut,
} from "@mistralai/mistralai/models/components";

const apiKey = "hRf3KcdkFoHXoOQyaSjMxFbb3iztuuv0";
const client = new Mistral({ apiKey: apiKey });

export const uploadPDFtoMistral = async (file: File) => {
	return await client.files.upload({
		file: {
			fileName: file.name,
			content: file,
		},
		purpose: "ocr",
	});
};

export const getSignedUrl = async (uploaded_PDF_Id: UploadFileOut) => {
	return await client.files.getSignedUrl({
		fileId: uploaded_PDF_Id.id,
	});
};

export const getJsonFromSignedUrl = async (signedUrl: FileSignedURL) => {
	return await client.ocr.process({
		model: "mistral-ocr-latest",
		document: {
			type: "document_url",
			documentUrl: signedUrl.url,
		},
		includeImageBase64: true,
	});
};
