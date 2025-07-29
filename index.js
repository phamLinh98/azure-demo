const https = require("https");
const fs = require("fs");
const path = require("path");
const AdmZip = require("adm-zip");

// In CommonJS, __filename and __dirname are available by default
const __filename = __filename;
const __dirname = __dirname;

let client;
let container;
let CosmosClient;

// Function to download and extract the zip file
async function loadCosmosClient() {
  if (CosmosClient) return CosmosClient;

  const zipUrl =
    "https://linhclassbobstorage.blob.core.windows.net/layers/my-helper.zip";
  const tempDir = path.join(__dirname, "temp");
  const zipPath = path.join(tempDir, "my-helper.zip");
  const extractPath = path.join(tempDir, "extracted");

  try {
    // Create temp directory if it doesn't exist
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Download the zip file
    await new Promise((resolve, reject) => {
      const file = fs.createWriteStream(zipPath);
      https
        .get(zipUrl, (response) => {
          response.pipe(file);
          file.on("finish", () => {
            file.close();
            resolve();
          });
        })
        .on("error", (err) => {
          fs.unlink(zipPath, () => {}); // Delete the file on error
          reject(err);
        });
    });

    // Extract the zip file
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(extractPath, true);

    // Add the extracted node_modules to the module path
    const nodeModulesPath = path.join(extractPath, "node_modules");
    if (fs.existsSync(nodeModulesPath)) {
      // Use require directly in CommonJS
      const cosmosModulePath = path.join(nodeModulesPath, "@azure", "cosmos");

      // Dynamically require CosmosClient
      const cosmosModule = require(cosmosModulePath);
      CosmosClient = cosmosModule.CosmosClient;
    } else {
      throw new Error("node_modules not found in extracted zip");
    }

    // Clean up zip file
    fs.unlinkSync(zipPath);

    return CosmosClient;
  } catch (error) {
    console.error("Error loading CosmosClient from zip:", error);
    throw error;
  }
}

// Export using CommonJS syntax
module.exports = async function handler(context, req) {
  context.log("HTTP trigger function processed a request.");

  try {
    if (!client) {
      // Load CosmosClient from the zip file
      const CosmosClientClass = await loadCosmosClient();

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
      client = new CosmosClientClass(cosmosDbConnectionString);
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
        const { resource: updateUsers } = await container.items.create(newUser);
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
        const { resource: userToDelete } = await container
          .item(userIdToDelete, userIdToDelete)
          .read();
        if (!userToDelete) {
          context.res = {
            status: 404,
            body: `User with ID ${userIdToDelete} not found.`,
          };
          return;
        }
        const { resource: deletedItem } = await container
          .item(userIdToDelete, userIdToDelete)
          .delete();
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
        const convertToString = userIdToUpdate.toString();
        if (!convertToString) {
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
          id: convertToString,
          ...updatedUserData,
        };

        const { resource: updatedItem } = await container
          .item(convertToString, convertToString)
          .replace(completeUserData);
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
};
