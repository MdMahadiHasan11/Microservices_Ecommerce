import { UploadApiResponse } from "cloudinary";
import fs from "fs";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import path from "path";
import stream from "stream";
import { cloudinaryUploadConfig } from "../../config/cloudinary.config";
import ApiError from "../errors/ApiError";
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), "/uploads"));
  },
  // filename: function (req, file, cb) {
  //   const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  //   cb(null, file.fieldname + "-" + uniqueSuffix);
  // },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const storageCloud = new CloudinaryStorage({
  cloudinary: cloudinaryUploadConfig,
  params: {
    public_id: (req, file) => {
      // My Special.Image#!@.png => 4545adsfsadf-45324263452-my-image.png
      // My Special.Image#!@.png => [My Special, Image#!@, png]
      const fileName = file.originalname
        .toLowerCase()
        .replace(/\s+/g, "-") // empty space remove replace with dash
        .replace(/\./g, "-")
        // eslint-disable-next-line no-useless-escape
        .replace(/[^a-z0-9\-\.]/g, ""); // non alpha numeric - !@#$
      const extension = file.originalname.split(".").pop();
      // binary -> 0,1 hexa decimal -> 0-9 A-F base 36 -> 0-9 a-z
      // 0.2312345121 -> "0.hedfa674338sasfamx" ->
      //452384772534
      const uniqueFileName =
        Math.random().toString(36).substring(2) +
        "-" +
        Date.now() +
        "-" +
        fileName +
        "." +
        extension;
      return uniqueFileName;
    },
  },
});
const upload = multer({ storage: storage });
const uploadCloud = multer({ storage: storageCloud });

const uploadToCloudinary = async (file: Express.Multer.File) => {
  // Upload an image
  const uploadResult = await cloudinaryUploadConfig.uploader
    .upload(file.path, {
      public_id: `${file.originalname}-${Date.now()}`,
    })
    .catch((error) => {
      throw error;
    });
  fs.unlinkSync(file.path);
  return uploadResult;
};
const uploadBufferToCloudinary = async (
  buffer: Buffer,
  fileName: string,
): Promise<UploadApiResponse | undefined> => {
  try {
    return new Promise((resolve, reject) => {
      const public_id = `pdf/${fileName}-${Date.now()}`;

      const bufferStream = new stream.PassThrough();
      bufferStream.end(buffer);

      cloudinaryUploadConfig.uploader
        .upload_stream(
          {
            resource_type: "auto",
            public_id: public_id,
            folder: "pdf",
          },
          (error, result) => {
            if (error) {
              return reject(error);
            }
            resolve(result);
          },
        )
        .end(buffer);
    });
  } catch (error: any) {
    console.log(error);
    throw new ApiError(401, `Error uploading file ${error.message}`);
  }
};

const deleteImageFromCLoudinary = async (url: string) => {
  try {
    //https://res.cloudinary.com/djzppynpk/image/upload/v1753126572/ay9roxiv8ue-1753126570086-download-2-jpg.jpg.jpg

    const regex = /\/v\d+\/(.*?)\.(jpg|jpeg|png|gif|webp)$/i;

    const match = url.match(regex);

    // console.log({ match });

    if (match && match[1]) {
      const public_id = match[1];
      await cloudinaryUploadConfig.uploader.destroy(public_id);
      console.log(`File ${public_id} is deleted from cloudinary`);
    }
  } catch (error: any) {
    throw new ApiError(401, "Cloudinary image deletion failed", error.message);
  }
};

export const fileUploader = {
  upload,
  uploadCloud,
  uploadToCloudinary,
  uploadBufferToCloudinary,
  deleteImageFromCLoudinary,
};
