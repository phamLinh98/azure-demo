import { BlobServiceClient } from "@azure/storage-blob";

const httpTrigger = async function (context, req) {
    context.log("Azure Function triggered to count images in linhclass-storage");

    try {
        // Lấy connection string từ environment variable
        const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
        if (!connectionString) {
            throw new Error("AZURE_STORAGE_CONNECTION_STRING is not set.");
        }

        // Khởi tạo BlobServiceClient
        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

        // Giả định "linhclass-storage" là tên container
        const containerName = "linhclass-storage";
        const containerClient = blobServiceClient.getContainerClient(containerName);

        // Danh sách các phần mở rộng ảnh hợp lệ
        const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp"];

        let imageCount = 0;

        // Liệt kê tất cả các blob trong container
        for await (const blob of containerClient.listBlobsFlat()) {
            // Kiểm tra nếu blob là ảnh dựa trên phần mở rộng
            if (imageExtensions.some(ext => blob.name.toLowerCase().endsWith(ext))) {
                imageCount++;
            }
        }

        // Trả về kết quả
        context.res = {
            status: 200,
            body: {
                message: `Found ${imageCount} image(s) in linhclass-storage.`,
                count: imageCount
            }
        };
    } catch (error) {
        context.log.error("Error occurred:", error.message);
        context.res = {
            status: 500,
            body: {
                message: "An error occurred while counting images.",
                error: error.message
            }
        };
    }
};

export default httpTrigger;