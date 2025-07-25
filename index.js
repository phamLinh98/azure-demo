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
    switch (req.method) {
      case "GET":
        const querySpec = {
          query: "SELECT * FROM c",
        };

        const { resources: users } = await container.items
          .query(querySpec)
          .fetchAll();
        context.log(`Query executed: ${users}`);
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
        break;
      case "POST":
        context.log("POST method is not implemented in this function.");
        const newUser = { name: "nguyen van a", age: 20 };
        const { resource:updateUsers } = await container.items.create(newUser);
        context.res = {
          status: 200,
          body: updateUsers,
        };
        break;
       case "DELETE":
        context.log("DELETE method is not implemented in this function.");
        // Giả sử bạn muốn xóa một người dùng theo ID
        const userIdToDelete = req.query.id; // Lấy ID từ query string
        if (!userIdToDelete) {
          context.res = {
            status: 400,
            body: "User ID is required for deletion.",
          };
          return;
        }
        const { resource: userToDelete } = await container.item(userIdToDelete, userIdToDelete).read();
        if (!userToDelete) {
          context.res = {
            status: 404,
            body: `User with ID ${userIdToDelete} not found.`,
          };
          return;
        }   
        const { resource: deletedItem } = await container.item(userIdToDelete, userIdToDelete).delete();
        context.log(`Deleted user with ID: ${deletedItem}`);
        context.res = {
          status: 200,
          body: `User with ID ${userIdToDelete} deleted successfully.`,
        };
        break;
        case "PUT":
        context.log("PUT method processing...");
        // Giả sử bạn muốn cập nhật một người dùng theo ID
        const userIdToUpdate = req.query.id; // Lấy ID từ query string
        if (!userIdToUpdate) {
          context.res = {
            status: 400,
            body: "User ID is required for update.",
          };
          return;
        }
        const updatedUserData = req.body; // Dữ liệu cập nhật từ body
        if (!updatedUserData || Object.keys(updatedUserData).length === 0) {
          context.res = {
            status: 400,
            body: "Updated user data is required.",
          };
          return;
        }
        
        // Thêm id và partition key vào dữ liệu cập nhật
        const completeUserData = {
          id: userIdToUpdate,
          ...updatedUserData
        };
        
        const { resource: updatedItem } = await container.item(userIdToUpdate, userIdToUpdate).replace(completeUserData);
        context.log(`Updated user with ID: ${updatedItem.id}`);
        context.res = {
          status: 200,
          body: updatedItem,
        };
        break;
      default:
        context.res = {
          status: 405,
          body: "Nothing to see here, move along.",
        };
        break;
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