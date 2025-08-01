import { QueueServiceClient } from '@azure/storage-queue';

export default async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    try {
        // Kiểm tra connection string
        const connectionString = process.env.AzureWebJobsStorage;
        
        if (!connectionString) {
            throw new Error('AzureWebJobsStorage connection string is not configured');
        }
        
        context.log('Connecting to queue storage...');
        
        // Kết nối đến Storage Account
        const queueServiceClient = QueueServiceClient.fromConnectionString(connectionString);
        
        // Lấy queue client
        const queueName = 'linhclass-messages';
        const queueClient = queueServiceClient.getQueueClient(queueName);
        
        // Kiểm tra queue có tồn tại không
        const queueExists = await queueClient.exists();
        context.log(`Queue ${queueName} exists:`, queueExists);
        
        if (!queueExists) {
            context.res = {
                status: 404,
                body: {
                    success: false,
                    error: `Queue '${queueName}' does not exist`
                }
            };
            return;
        }
        
        // Lấy queue properties để kiểm tra số lượng messages
        const properties = await queueClient.getProperties();
        context.log('Queue properties:', {
            approximateMessagesCount: properties.approximateMessagesCount
        });
        
        // Lấy messages từ queue (sử dụng receiveMessages thay vì peekMessages)
        const messages = [];
        const maxMessages = 32;
        
        // Thử receiveMessages với visibilityTimeoutInSeconds để không xóa messages ngay
        const response = await queueClient.receiveMessages({ 
            numberOfMessages: maxMessages,
            visibilityTimeoutInSeconds: 30 // Messages sẽ ẩn trong 30 giây nhưng không bị xóa
        });
        
        context.log('Received messages:', response.receivedMessageItems?.length || 0);
        
        if (response.receivedMessageItems && response.receivedMessageItems.length > 0) {
            messages.push(...response.receivedMessageItems);
            
            // Nếu bạn muốn messages vẫn ở trong queue, cần update visibility timeout
            // hoặc không delete chúng
        }
        
        context.res = {
            status: 200,
            body: {
                success: true,
                queueName: queueName,
                approximateMessagesCount: properties.approximateMessagesCount,
                messageCount: messages.length,
                messages: messages.map(msg => ({
                    messageId: msg.messageId,
                    messageText: msg.messageText,
                    insertedOn: msg.insertedOn,
                    expiresOn: msg.expiresOn,
                    popReceipt: msg.popReceipt
                }))
            }
        };
        
    } catch (error) {
        context.log.error('Error retrieving messages from queue:', error);
        context.log.error('Error details:', error.stack);
        
        context.res = {
            status: 500,
            body: {
                success: false,
                error: error.message,
                details: error.toString()
            }
        };
    }
};