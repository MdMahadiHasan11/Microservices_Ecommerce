import { ActionType } from "@prisma/client";
import prisma from "../../../shared/prisma";
import { IInventoryCreate } from "./inventory.validation";

const createInventory = async (payload: IInventoryCreate) => {
  const result = await prisma.inventory.create({
    data: {
      ...payload,
      histories: {
        create: {
          actionType: ActionType.IN,
          quantityChanged: payload.quantity,
          lastQuantity: 0,
          newQuantity: payload.quantity,
        },
      },
    },
    select: {
      id: true,
      quantity: true,
    },
  });

  return result;
};
export const InventoryService = {
  createInventory,
};
