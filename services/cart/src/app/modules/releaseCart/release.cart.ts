import axios from "axios";
import config from "../../../config";
import redis from "../../helper/redis";

export const clearCartService = async (cartId: string) => {
  try {
    const data = await redis.hgetall(`cart:${cartId}`);

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
    await redis.del(`cart:${cartId}`);
  } catch (error) {
    throw error;
  }
};
