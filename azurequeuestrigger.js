export default async function (context, queueItem) {
  context.log("Queue trigger function processed work item:", queueItem);

  try {
    let messageData;
    if (typeof queueItem === "string") {
      try {
        messageData = JSON.parse(queueItem);
      } catch (e) {
        messageData = queueItem;
      }
    } else {
      messageData = queueItem;
    }

    context.log("Processed message data:", messageData);
    context.log("Successfully processed queue message");
  } catch (error) {
    context.log.error("Error processing queue message:", error);
    throw error;
  }
};