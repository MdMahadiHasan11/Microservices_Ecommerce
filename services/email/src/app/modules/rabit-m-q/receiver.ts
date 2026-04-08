import amqp from "amqplib";
import config from "../../../config";
import prisma from "../../../shared/prisma";
import ApiError from "../../errors/ApiError";
import { transporter } from "../../utils/sendEmail";
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

receiveFromQueue("send-email", async (message) => {
  console.log("Received message:", message);

  // {"id":"8a4bfead-da60-4f8a-be32-ecb242475708","userId":"1","userName":"Hasam","userEmail":"h@gmail.com","subtotal":6000,"tax":0,"grandTotal":6000,"status":"PENDING","createdAt":"2026-04-08T10:00:50.454Z","updatedAt":"2026-04-08T10:00:50.454Z"}

  const emailDetails = JSON.parse(message);
  const { userEmail, grandTotal, userName } = emailDetails;

  const from = config.smtp.default_email_sender;

  const subject = "Order Confirmation";
  const body = `Hello ${userName}, your order has been confirmed.Your order id is ${emailDetails.id}. Your total amount is ${grandTotal}`;

  const emailSendOptions = {
    from,
    to: userEmail,
    subject,
    text: body,
  };

  const { rejected } = await transporter.sendMail(emailSendOptions);

  if (rejected.length) {
    console.log("Email rejected", rejected);
    throw new ApiError(500, "Email sending failed!");
  }

  await prisma.email.create({
    data: {
      sender: from as string,
      recipient: userEmail,
      subject,
      body,
      source: "OrderConfirmation",
    },
  });

  console.log("Email sent successful");
});
