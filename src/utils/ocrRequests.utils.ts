import { Mistral } from "@mistralai/mistralai";
import {
	FilePurpose,
	FileSignedURL,
	UploadFileOut,
} from "@mistralai/mistralai/models/components";
import * as fs from "fs";
import path from "path";

const dataJsonPath = path.resolve("../../data.json");

let apiKey = "";
if (fs.existsSync(dataJsonPath)) {
	const data = JSON.parse(fs.readFileSync(dataJsonPath, "utf-8"));
	apiKey = data.apiKey;
} else {
	console.warn("data.json doesn't exist");
}

const client = new Mistral({ apiKey: apiKey });

export const uploadPDFtoMistral = async (file: File) => {
	return await client.files.upload({
		file: {
			fileName: file.name,
			content: file,
		},
		purpose: "ocr" as FilePurpose,
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
