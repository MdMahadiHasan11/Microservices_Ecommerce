import { ActionType } from "@prisma/client";
import httpStatus from "http-status";
import prisma from "../../../shared/prisma";
import ApiError from "../../errors/ApiError";
import { IInventoryCreate, IInventoryUpdate } from "./inventory.validation";

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

const updateInventory = async (id: string, payload: IInventoryUpdate) => {
  const inventory = await prisma.inventory.findUniqueOrThrow({
    where: {
      id,
    },
  });

  if (!inventory) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Inventory not found");
  }

  const lastHistory = await prisma.history.findFirst({
    where: {
      inventoryId: id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  let newQuantity = inventory.quantity;
  if (payload.actionType === ActionType.IN) {
    newQuantity += payload?.quantity;
  } else {
    newQuantity -= payload?.quantity;
  }

  const updateInventory = await prisma.inventory.update({
    where: {
      id,
    },
    data: {
      quantity: newQuantity,
      histories: {
        create: {
          actionType: payload.actionType,
          quantityChanged: payload?.quantity,
          lastQuantity: lastHistory?.newQuantity || 0,
          newQuantity,
        },
      },
    },
    select: {
      id: true,
      quantity: true,
    },
  });

  console.log({ newQuantity });

  return updateInventory;
};

const getInventoryById = async (id: string) => {
  const inventory = await prisma.inventory.findUnique({
    where: {
      id,
    },
    include: {
      histories: {
        orderBy: {
          createdAt: "desc",
        },
      }
    },
  });

  if (!inventory) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Inventory not found");
  }

  return inventory;
};

export const InventoryService = {
  createInventory,
  updateInventory,
  getInventoryById,
};
