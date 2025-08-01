export default async function (context, myBlob) {
  try {
    // Lấy thông tin từ bindingData
    const blobName = context.bindingData.blobTrigger; // Đường dẫn blob, ví dụ: dataimages/test.jpg
    const blobSize = myBlob.length; // Kích thước blob (byte)

    // Ghi log thông tin ảnh
    context.log(`New image uploaded:`);
    context.log(`- Name: ${blobName}`);
    context.log(`- Size: ${blobSize} bytes`);

    // Optionally: Trả về thông tin nếu function được gọi qua HTTP hoặc cần output
    context.bindings.outputDocument = {
      name: blobName,
      size: blobSize,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    context.log.error("Error processing blob:", error);
    throw error;
  }
}
