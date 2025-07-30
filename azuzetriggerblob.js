import { BlobServiceClient } from "@azure/storage-blob";
import AdmZip from "adm-zip";
import { writeFile } from "fs/promises";
import path from "path";
import os from "os";

export default async function (context, req) {
  context.log("Azure Function triggered to import and use hello.js from my-azure-demo.zip");

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

    // Tên file ZIP
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

    // Tìm file hello.js
    const helloJsEntry = zipEntries.find(entry => entry.entryName === "azure-demo/hello.js");
    const test123 = zipEntries.find(entry => entry.entryName === "azure-demo/node_modules/@azure/storage-blob/dist/esm/.js");
    context.log(`Found entries in ZIP`, test123);
    if (!helloJsEntry) {
      throw new Error("File azure-demo/hello.js not found in my-azure-demo.zip.");
    }

    // Trích xuất nội dung hello.js
    const helloJsContent = helloJsEntry.getData().toString("utf8");
    const test1234 = test123.getData().toString("utf8");
    context.log(`Content of test1234: ${test1234}`);
    // Lưu hello.js vào thư mục tạm của hệ thống
    const tempDir = os.tmpdir();
    const tempFilePath1 = path.join(tempDir, `hello-${Date.now()}.js`);
    const tempFilePath2 = path.join(tempDir, `node-${Date.now()}.js`);
    await writeFile(tempFilePath1, helloJsContent);
    await writeFile(tempFilePath2, test1234);

    // Import động hello.js
    const fileUrl = `file://${path.resolve(tempFilePath1).replace(/\\/g, "/")}`;
    const testUrl = `file://${path.resolve(tempFilePath2).replace(/\\/g, "/")}`;
    context.log(`Importing hello.js from ${fileUrl}`);
    context.log(`Importing test123 from ${testUrl}`);
    const module = await import(fileUrl);
    const testModule = await import(testUrl);
    context.log(`Module imported successfully`, testModule);
    // Gọi helloFunction từ module
    const { helloFunction } = module;
    if (!helloFunction) {
      throw new Error("helloFunction not found in hello.js.");
    }

    // Gọi helloFunction với tham số name
    const helloResult = helloFunction("Linh dep trai hehe");

    // Trả về kết quả
    context.res = {
      status: 200,
      body: {
        message: `Successfully imported and executed azure-demo/hello.js from ${blobName}.`,
        content: helloResult
      }
    };
  } catch (error) {
    context.log.error("Error occurred:", error.message);
    context.res = {
      status: 500,
      body: {
        message: "An error occurred while processing the ZIP file or executing hello.js.",
        error: error.message
      }
    };
  }
}

// Hàm helper để chuyển readable stream thành buffer
async function streamToBuffer(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on("data", (chunk) => chunks.push(chunk));
    readableStream.on("end", () => resolve(Buffer.concat(chunks)));
    readableStream.on("error", reject);
  });
}