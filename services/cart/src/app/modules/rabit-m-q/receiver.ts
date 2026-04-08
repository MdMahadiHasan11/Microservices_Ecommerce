import amqp from "amqplib";
import redis from "../../helper/redis";
const receiveFromQueue = async (
  queueName: string,
  callback: (message: string) => void,
) => {
  const connection = await amqp.connect(`amqp://localhost`);
  const channel = await connection.createChannel();

  //
  const exchangeName = "order_exchange";
  await channel.assertExchange(exchangeName, "direct", { durable: true });

  //subscribe
  const q = await channel.assertQueue(queueName, { durable: true });
  await channel.bindQueue(q.queue, exchangeName, queueName);

  channel.consume(
    q.queue,
    (msg) => {
      if (msg) {
        callback(msg.content.toString());
        channel.ack(msg);
      }
    },
    {
      noAck: false,
    },
  );
};

receiveFromQueue("clear-cart", (message) => {
  console.log("Received message:", message);

  const cartSessionId = JSON.parse(message).cartSessionId;
  console.log("Clearing cart for session:", cartSessionId);

  redis.del(`cart:${cartSessionId}`);
  redis.del(`session:${cartSessionId}`);

  console.log("Cart cleared successfully");
});
