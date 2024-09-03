import Joi from "joi";
import { RefreshToken, User } from "../../models/index.js";
import CustomErrorHandler from "../../services/customErrorHnadler.js";
import bcrypt from "bcrypt";
import JwtService from "../../services/JwtService.js";
import { REFRESH_SECRET } from "../../config/index.js";

const registerController = {
  async register(req, res, next) {
    const registerSchema = Joi.object({
      name: Joi.string().min(3).max(30).required(),
      email: Joi.string().email().required(),
      password: Joi.string()
        .pattern(new RegExp("^[a-zA-Z0-9]{3,30}$"))
        .required(),
      repeat_password: Joi.ref("password"),
    });

    const { error } = registerSchema.validate(req.body);

    if (error) {
      return next(error);
    }

    try {
      const exist = await User.exists({ email: req.body.email });

      if (exist) {
        return next(
          CustomErrorHandler.alreadyExist("This email is already registered.")
        );
      }
    } catch (err) {
      return next(err);
    }

    //Hash password

    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword,
    });

    let access_token;
    let refresh_token;
    try {
      const result = await user.save();

      // Token
      access_token = JwtService.sign({ _id: result._id, role: result.role });

      refresh_token = JwtService.sign({ _id: result._id, role: result.role },'1Y',REFRESH_SECRET);

      // database whitelist

      await RefreshToken.create({token: refresh_token})


    } catch (err) {
      return next(err);
    }



    res.json({ access_token, refresh_token});
  },
};

export default registerController;
