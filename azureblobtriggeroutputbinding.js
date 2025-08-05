import { BlobServiceClient } from "@azure/storage-blob";

export default async function handler(context, myBlob) {
  context.log(
    "JavaScript blob trigger function processed blob \n Name:",
    context.bindingData.name,
    "\n Blob Size:",
    myBlob.length,
    "Bytes"
  );

  try {
    // Get connection string from environment variables
    const connectionString = process.env.AzureWebJobsStorage;

    if (!connectionString) {
      throw new Error(
        "Azure Storage connection string not found in environment variables"
      );
    }

    // Create BlobServiceClient
    const blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);

    // Get container client
    const containerName = "linhclassqueuestorage";
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // Get blob client
    const blobName = "linhclass-blob";
    const blobClient = containerClient.getBlobClient(blobName);

    // Check if blob exists
    const exists = await blobClient.exists();
    if (!exists) {
      context.log.warn(
        `Blob ${blobName} does not exist in container ${containerName}`
      );
      return;
    }

    // Download blob content
    context.log(`Downloading blob: ${blobName}`);
    const downloadResponse = await blobClient.download();

    // Convert stream to string
    const blobData = await streamToString(downloadResponse.readableStreamBody);

    context.log(
      `Successfully downloaded blob data. Size: ${blobData.length} characters`
    );
    context.log("Blob content preview:", blobData.substring(0, 200) + "...");

    // Process the blob data as needed
    let processedData;
    try {
      // Try to parse as JSON if it's JSON data
      processedData = JSON.parse(blobData);
      context.log("Blob contains valid JSON data");
    } catch (parseError) {
      // If not JSON, treat as plain text
      processedData = blobData;
      context.log("Blob contains text data");
    }

    // You can now use processedData for your business logic
    context.log("Data processing completed successfully");

    // Optional: Return the data if needed
    return {
      success: true,
      dataSize: blobData.length,
      dataPreview: blobData.substring(0, 100),
    };
  } catch (error) {
    context.log.error("Error retrieving blob data:", error.message);
    context.log.error("Stack trace:", error.stack);
    throw error;
  }
}

// Helper function to convert stream to string
async function streamToString(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on("data", (data) => {
      chunks.push(data.toString());
    });
    readableStream.on("end", () => {
      resolve(chunks.join(""));
    });
    readableStream.on("error", reject);
  });
}
