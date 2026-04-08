import axios from "axios";
import httpStatus from "http-status";
import config from "../../../config";
import prisma from "../../../shared/prisma";
import ApiError from "../../errors/ApiError";
import sendToQueue from "../rabit-m-q/queue";
import { IOrder } from "./order.validation";

const checkout = async (payload: IOrder) => {
  const response = await axios.get(
    `${config.cart_service_url}/cart/get-my-cart`,
    {
      headers: {
        "x-cart-session-id": payload.cartSessionId,
      },
    },
  );

  const cartData = response.data.data;

  // const cartItems = cartData.map((item: any) => {
  //   return {
  //     productId: item.productId,
  //     quantity: item.quantity,
  //   };
  // });

  if (cartData.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Cart is empty");
  }

  const productDetails = await Promise.all(
    cartData.map(async (item: any) => {
      const productResponse = await axios.get(
        `${config.product_service_url}/products/${item.productId}`,
      );
      return {
        productId: productResponse.data.data.id,
        productName: productResponse.data.data.name,
        sku: productResponse.data.data.sku,
        price: productResponse.data.data.price,
        quantity: item.quantity,
        total: productResponse.data.data.price * item.quantity,
      };
    }),
  );

  const subtotalAmount = productDetails.reduce((acc, item) => {
    return acc + item.total;
  }, 0);

  const tax = 0;

  const grantTotalAmount = subtotalAmount + tax;

  const order = await prisma.order.create({
    data: {
      userId: payload.userId,
      userName: payload.userName,
      userEmail: payload.userEmail,
      subtotal: subtotalAmount,
      tax,
      grandTotal: grantTotalAmount,
      orderItems: {
        create: productDetails.map((item: any) => {
          return {
            ...item,
          };
        }),
      },
    },
  });

  // await axios.get(`${config.cart_service_url}/cart/clear-to-cart`, {
  //   headers: {
  //     "x-cart-session-id": payload.cartSessionId,
  //   },
  // });

  // await axios.post(`${config.email_service_url}/email/send`, {
  //   recipient: payload.userEmail,
  //   subject: "Order Confirmation",
  //   body: `Your order has been successfully placed. Order ID: ${order.id}`,
  //   source: "Checkout",
  // });

  //sent to queue
  sendToQueue("send-email", JSON.stringify(order));
  sendToQueue(
    "clear-cart",
    JSON.stringify({
      cartSessionId: payload.cartSessionId,
    }),
  );

  return order;
};

const getOrderById = async (id: string) => {
  if (!id) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Order id is required");
  }
  const result = await prisma.order.findUnique({
    where: {
      id,
    },
    include: {
      orderItems: true,
    },
  });

  return result;
};

const getAllOrders = async () => {
  const result = await prisma.order.findMany({
    include: {
      orderItems: true,
    },
  });

  return result;
};

export const OrderService = { checkout, getOrderById, getAllOrders };
