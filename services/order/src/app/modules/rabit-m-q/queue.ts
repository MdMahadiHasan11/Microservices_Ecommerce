import amqp from "amqplib";
import config from "../../../config";
const sendToQueue = async (queueName: string, message: string) => {
  const connection = await amqp.connect(config.queue_url!);
  const channel = await connection.createChannel();

  //
  const exchangeName = "order_exchange";
  await channel.assertExchange(exchangeName, "direct", { durable: true });

  //publish
  channel.publish(exchangeName, queueName, Buffer.from(message));
  console.log(`Sent ${message} to ${queueName}`);

  setTimeout(() => {
    connection.close();
  }, 500);
};

export default sendToQueue;
