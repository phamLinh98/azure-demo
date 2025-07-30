import { BlobServiceClient } from "@azure/storage-blob";
import AdmZip from "adm-zip";

export default async function (context, req) {
  context.log("Azure Function triggered to unzip and list files in my-azure-demo.zip");

  try {
    // Lấy connection string từ environment variable
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    if (!connectionString) {
      throw new Error("AZURE_STORAGE_CONNECTION_STRING is not set.");
    }

    // Khởi tạo BlobServiceClient
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

    // Kết nối tới container library-function
    const containerName = "library-function";
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // Tên file ZIP cần giải nén
    const blobName = "my-azure-demo.zip";
    const blobClient = containerClient.getBlockBlobClient(blobName);

    // Kiểm tra xem file ZIP có tồn tại không
    const blobExists = await blobClient.exists();
    if (!blobExists) {
      throw new Error(`File ${blobName} does not exist in container ${containerName}.`);
    }

    // Tải file ZIP về dưới dạng buffer
    const downloadResponse = await blobClient.download();
    const buffer = await streamToBuffer(downloadResponse.readableStreamBody);

    // Giải nén file ZIP trong bộ nhớ
    const zip = new AdmZip(buffer);
    const zipEntries = zip.getEntries();

    // Lấy danh sách tên file trong ZIP
    const fileList = zipEntries.map(entry => entry.entryName);
    
    // Log danh sách file
    fileList.forEach(file => context.log(`Found file in ZIP: ${file}`));

    // Trả về danh sách file
    context.res = {
      status: 200,
      body: {
        message: `Found ${fileList.length} file(s) in ${blobName}.`,
        files: fileList
      }
    };
  } catch (error) {
    context.log.error("Error occurred:", error.message);
    context.res = {
      status: 500,
      body: {
        message: "An error occurred while processing the ZIP file.",
        error: error.message
      }
    };
  }
};

// Hàm helper để chuyển readable stream thành buffer
async function streamToBuffer(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on("data", (chunk) => chunks.push(chunk));
    readableStream.on("end", () => resolve(Buffer.concat(chunks)));
    readableStream.on("error", reject);
  });
}