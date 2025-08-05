export default async function (context, req) {
  try {
    const message = {
      name: "linh",
      age: "1234",
      sex: "Men",
      lover: "Chilinh"
    };
    context.bindings.outputQueueItem = JSON.stringify(message);
    context.res = {
      status: 200,
      body: "Message sent successfully to linhclass-messages queue",
    };
  } catch (error) {
    context.log.error("Error sending message:", error);
    context.res = {
      status: 500,
      body: `Error sending message: ${error.message}`,
    };
  }
}