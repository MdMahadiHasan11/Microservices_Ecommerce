import axios from "axios";
import { Request, Response } from "express";
import httpStatus from "http-status";
import { v4 as uuid } from "uuid";
import config from "../../../config";
import ApiError from "../../errors/ApiError";
import redis from "../../helper/redis";
import { ICartItem } from "./cart.validation";

const getMyCart = async (req: Request, res: Response) => {
  let cartSessionId = (req.headers["x-cart-session-id"] as string) || null;

  if (!cartSessionId) {
    return [];
  }

  const session = await redis.exists(`session:${cartSessionId}`);

  if (!session) {
    await redis.del(`cart:${cartSessionId}`);
    await redis.del(`session:${cartSessionId}`);

    return [];
  }

  const items = await redis.hgetall(`cart:${cartSessionId}`);

  if (Object.keys(items).length === 0) {
    return [];
  }

  //format items
  const formattedItems = Object.keys(items).map((key) => {
    return JSON.parse(items[key]);
  });

  return formattedItems;
};

const addToCart = async (payload: ICartItem, req: Request, res: Response) => {
  let cartSessionId = (req.headers["x-cart-session-id"] as string) || null;

  //session id is exists
  if (cartSessionId) {
    const exists = await redis.exists(`session:${cartSessionId}`);

    if (!exists) {
      cartSessionId = null;
    }
  }

  if (!cartSessionId) {
    cartSessionId = uuid();

    await redis.setex(
      `session:${cartSessionId}`,
      Number(config.redis.cart_ttl),
      cartSessionId,
    );

    //set headers
    res.setHeader("x-cart-session-id", cartSessionId);
  }

  //todo check inventory before adding to cart

  const response = await axios.get(`
    ${config.inventory_service_url}/inventories/${payload.inventoryId}`);

  const inventory = response.data.data;

  if (inventory.quantity < payload.quantity) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Inventory not enough");
  }

  //todo update the inventory after adding to cart

  const payloadJson = JSON.stringify(payload);
  await redis.hset(`cart:${cartSessionId}`, payload.productId, payloadJson);

  //update the inventory
  await axios.put(
    `${config.inventory_service_url}/inventories/${payload.inventoryId}`,
    {
      actionType: "OUT",
      quantity: payload.quantity,
    },
  );
  return {
    cartSessionId,
  };
};

const cleatToCart = async (req: Request) => {
  const cartSessionId = (req.headers["x-cart-session-id"] as string) || null;

  if (!cartSessionId) {
    return {
      message: "Cart is empty",
    };
  }

  const exist = await redis.exists(`session:${cartSessionId}`);

  if (!exist) {
    delete req.headers["x-cart-session-id"];
    return {
      message: "Cart is empty",
    };
  }


  //same as release cart start
  try {
    const data = await redis.hgetall(`cart:${cartSessionId}`);

    if (Object.keys(data).length === 0) {
      return;
    }

    const items = Object.keys(data).map((key) => {
      const { quantity, inventoryId } = JSON.parse(data[key]) as {
        quantity: number;
        inventoryId: string;
      };
      return { productId: key, quantity, inventoryId };
    });

    // here one request all update  to do

    const requests = items.map((item) => {
      return axios.put(
        `${config.inventory_service_url}/inventories/${item.inventoryId}`,
        {
          quantity: item.quantity,
          actionType: "IN",
        },
      );
    });

    await Promise.all(requests);

    console.log("Inventory updated");
    await redis.del(`cart:${cartSessionId}`);
  } catch (error) {
    throw error;
  }
  //same as release cart end

  await redis.del(`cart:${cartSessionId}`);
  await redis.del(`session:${cartSessionId}`);
  delete req.headers["x-cart-session-id"];

  return {
    message: "Cart cleared successfully",
  };
};

export const AddToCartService = {
  addToCart,
  getMyCart,
  cleatToCart,
};
