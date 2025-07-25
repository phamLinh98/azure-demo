import { CosmosClient } from "@azure/cosmos";

let client;
let container;

export default async function DemoFunction(context, req) {
  context.log("HTTP trigger function processed a request.");

  try {
    if (!client) {
      // Lấy thông tin kết nối từ biến môi trường
      const cosmosDbConnectionString = process.env.CosmosDbConnectionString;
      const databaseId = process.env.CosmosDbDatabaseId;
      const containerId = process.env.CosmosDbContainerId;

      if (!cosmosDbConnectionString) {
        context.res = {
          status: 500,
          body: "CosmosDbConnectionString environment variable is not set.",
        };
        return;
      }

      // Khởi tạo CosmosClient
      client = new CosmosClient(cosmosDbConnectionString);
      const database = client.database(databaseId);
      container = database.container(containerId);
    }

    // Truy vấn tất cả tài liệu từ container 'users'
    // 'SELECT * FROM c' là truy vấn SQL API để lấy tất cả tài liệu. [10, 20]
    const querySpec = {
      query: "SELECT * FROM c",
    };

    const { resources: users } = await container.items
      .query(querySpec)
      .fetchAll();

    if (users.length === 0) {
      context.log("No users found.");
      context.res = {
        status: 200,
        body: "No users found in the 'users' table.",
      };
    } else {
      context.log(`Found ${users.length} users.`);
      context.res = {
        status: 200,
        body: users,
      };
    }
  } catch (error) {
    context.log.error(
      `Error connecting to Cosmos DB or querying data: ${error.message}`
    );
    context.res = {
      status: 500,
      body: `Error: ${error.message}`,
    };
  }
}

