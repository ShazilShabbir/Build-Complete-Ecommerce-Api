import { Product } from "../models";
import multer from "multer";
import path from "path";
import CustomErrorHandler from "../services/customErrorHnadler.js";
import fs from "fs";
import productSchema from "../validators/productValidator.js";

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(
            Math.random() * 1e9
        )}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const handelMultipartData = multer({
  storage,
  limits: { fileSize: 1000000 * 5 }, // 5mb
}).single("image");

const productController = {
  //add products

  async store(req, res, next) {
    // Multipart form data
    handelMultipartData(req, res, async (err) => {
      if (err) {
        return next(CustomErrorHandler.serverError(err.message));
      }
      const filePath = req.file.path;
      console.log(req.file);
      
      // validation
      const { error } = productSchema.validate(req.body);
      if (error) {
        // Delete the uploaded file
        fs.unlink(`${appRoot}/${filePath}`, (err) => {
          if (err) {
            return next(CustomErrorHandler.serverError(err.message));
          }
        });

        return next(error);
        // rootfolder/uploads/filename.png
      }

      const { name, price, size } = req.body;
      let document;
      try {
        document = await Product.create({
          name,
          price,
          size,
          image: filePath,
        });
      } catch (err) {
        return next(err);
      }

      res.status(201).json(document);
    });
  },

  //update products

  async update(req, res, next) {
    handelMultipartData(req, res, async (err) => {
      if (err) {
        return next(CustomErrorHandler.serverError(err.message));
      }
      let filePath;
      if (req.file) {
        filePath = req.file.path;
      }

      // validation
      const { error } = productSchema.validate(req.body);
      if (error) {
        // Delete the uploaded file
        if (req.file) {
          fs.unlink(`${appRoot}/${filePath}`, (err) => {
            if (err) {
              return next(CustomErrorHandler.serverError(err.message));
            }
          });
        }

        return next(error);
        // rootfolder/uploads/filename.png
      }

      const { name, price, size } = req.body;
      let document;
      try {
        document = await Product.findOneAndUpdate(
          { _id: req.params.id },
          {
            name,
            price,
            size,
            ...(req.file && { image: filePath }),
          },
          { new: true }
        );
      } catch (err) {
        return next(err);
      }

      res.status(201).json(document);
    });
  },

  //delete products

  async destroy(req, res, next) {
    const document = await Product.findOneAndRemove({ _id: req.params.id });

    if (!document) {
      return next(new Error("Nothing to delete"));
    }
    //image delete
    const imagePath = document._doc.image;
    console.log(imagePath);
    
    fs.unlink(`${appRoot}/${imagePath}`, (err) => {
      if (err) {
        return next(CustomErrorHandler.serverError());
      }
      return  res.json(document);
    });
   
  },


//Get all products

  async index(req, res, next) {
    let document

    //pagination mongoose-pagination
    try {
      document = await Product.find().select('-__v -updatedAt').sort({_id: -1})

    } catch (error) {
      return next(CustomErrorHandler.serverError())
    }
    res.json(document)
  },


async show(req,res,next){
  let document;

  try {
    document = await Product.findOne({_id: req.params.id}).select('-__v -updatedAt')
  } catch (error) {
    return next(CustomErrorHandler.serverError())
  }

   res.json(document)
}




};

export default productController;
