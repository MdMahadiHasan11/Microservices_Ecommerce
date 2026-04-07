import axios from "axios";
import httpStatus from "http-status";
import config from "../../../config";
import prisma from "../../../shared/prisma";
import ApiError from "../../errors/ApiError";
import { ICreateProduct } from "./product.validation";
const createProduct = async (payload: ICreateProduct) => {
  // 1. SKU check
  const isSameSku = await prisma.product.findFirst({
    where: { sku: payload.sku },
  });

  if (isSameSku) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Product with same SKU already exists",
    );
  }

  // 2. Create product (Transaction start)
  const product = await prisma.$transaction(async (tx) => {
    const createdProduct = await tx.product.create({
      data: payload,
      select: {
        id: true,
        sku: true,
      },
    });

    return createdProduct;
  });

  console.log("Product created:", product);

  let inventory;

  try {
    // 3. Call Inventory Service
    const response = await axios.post(
      `${config.inventory_url}/inventories`,
      {
        productId: product.id,
        sku: product.sku,
      },
      {
        headers: {
          // "x-gateway-secret": process.env.GATEWAY_SECRET, // Gateway call
          "x-service-secret": process.env.SERVICE_PRODUCT_SECRET, // optional, if Service→Service
          "Content-Type": "application/json",
        },
      },
    );

    inventory = response.data.data;

    console.log("Inventory created:", inventory);
  } catch (error) {
    // ❌ Inventory failed → rollback manually
    await prisma.product.delete({
      where: { id: product.id },
    });

    throw new ApiError(
      httpStatus.BAD_GATEWAY,
      "Inventory service failed. Product rolled back.",
    );
  }

  // 4. Update product with inventoryId (Transaction)
  const updatedProduct = await prisma.$transaction(async (tx) => {
    return await tx.product.update({
      where: { id: product.id },
      data: {
        inventoryId: inventory.id,
      },
      select: {
        id: true,
        sku: true,
        inventoryId: true,
      },
    });
  });

  return updatedProduct;
};

const getProduct = async () => {
  const result = await prisma.product.findMany({
    select: {
      id: true,
      sku: true,
      name: true,
      price: true,
      inventoryId: true,
    },
  });
  return result;
};

const getProductById = async (id: string) => {
  const product = await prisma.product.findUnique({
    where: {
      id,
    },
  });

  if (!product) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Product not found");
  }

  if (product.inventoryId == null) {
    const response = await axios.post(
      `${config.inventory_url}/inventories`,
      {
        productId: product.id,
        sku: product.sku,
      },

      {
        headers: {
          // "x-gateway-secret": process.env.GATEWAY_SECRET, // Gateway call
          "x-service-secret": process.env.SERVICE_PRODUCT_SECRET, // optional, if Service→Service
          "Content-Type": "application/json",
        },
      },
    );

    const inventory = response.data.data;

    console.log("Inventory create successfully", inventory);

    await prisma.product.update({
      where: {
        id,
      },
      data: {
        inventoryId: inventory.id,
      },
    });

    console.log("Product updated successfully", inventory.id);

    const data = {
      ...product,
      inventoryId: inventory.id,
      stock: inventory.quantity || 0,
      stockStatus: inventory.quantity > 0 ? "inStock" : "outOfStock",
    };

    return data;
  }

  const response = await axios.get(
    `${config.inventory_url}/inventories/${product.inventoryId}`,
    {
      headers: {
        // "x-gateway-secret": process.env.GATEWAY_SECRET, // Gateway call
        "x-service-secret": process.env.SERVICE_PRODUCT_SECRET, // optional, if Service→Service
        "Content-Type": "application/json",
      },
    },
  );

  const inventory = response.data.data;

  const data = {
    ...product,
    inventoryId: inventory.id,
    stock: inventory.quantity || 0,
    stockStatus: inventory.quantity > 0 ? "inStock" : "outOfStock",
  };

  return data;
};

const updateProductById = async (
  id: string,
  payload: Partial<ICreateProduct>,
) => {
  if (!id) {
    throw new ApiError(httpStatus.BAD_REQUEST, "ID is required");
  }

  if (!payload) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Payload is required");
  }

  if (payload.sku) {
    const existingProduct = await prisma.product.findUnique({
      where: {
        sku: payload.sku,
      },
    });
    if (existingProduct) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Product with same SKU already exists",
      );
    }
  }
  const product = await prisma.product.update({
    where: {
      id,
    },
    data: payload,
  });
  return product;
};

export const ProductService = {
  getProduct,
  createProduct,
  getProductById,
  updateProductById,
};
