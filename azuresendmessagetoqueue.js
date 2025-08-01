import { QueueClient } from "@azure/storage-queue";
const connectionString = process.env.AzureWebJobsStorage;

export default async function (context, req) {
  try {
    // Tạo QueueClient cho queue linhthusinh-messages
    const queueClient = new QueueClient(
      connectionString,
      "linhclass-messages"
    );

    // Message cần gửi
    const message = {
      name: "linh",
      age: "1234",
      sex: "Men",
      lover: "Chilinh"
    };

    // Chuyển message thành base64
    const messageBuffer = Buffer.from(JSON.stringify(message));
    const encodedMessage = messageBuffer.toString("base64");

    // Gửi message vào queue
    await queueClient.sendMessage(encodedMessage);

    context.res = {
      status: 200,
      body: "Message sent successfully to linhthusinh-messages queue",
    };
  } catch (error) {
    context.log.error("Error sending message:", error);
    context.res = {
      status: 500,
      body: `Error sending message: ${error.message}`,
    };
  }
}
