import { QueueClient } from "@azure/storage-queue";

export default async function (context, myBlob) {
    context.log("Blob trigger function processed blob:", context.bindingData.blobTrigger);

    try {
        // Tạo QueueClient cho queue linhthusinh-messages
        const queueClient = new QueueClient(
            process.env.AzureWebJobsStorage,
            "linhclass-messages"
        );

        // Tạo message chứa thông tin blob
        const message = {
            name: "linh",
            age: "1234",
            blobName: context.bindingData.blobTrigger,
            blobSize: myBlob.length,
            timestamp: new Date().toISOString()
        };

        // Chuyển message thành base64
        const messageBuffer = Buffer.from(JSON.stringify(message));
        const encodedMessage = messageBuffer.toString('base64');

        // Gửi message vào queue
        await queueClient.sendMessage(encodedMessage);

        context.log("Message sent to queue successfully");
    } catch (error) {
        context.log.error('Error sending message to queue:', error);
        throw error;
    }
};