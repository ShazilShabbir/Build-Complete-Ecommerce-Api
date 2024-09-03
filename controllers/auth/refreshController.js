import Joi from "joi";
import { RefreshToken, User } from "../../models";
import CustomErrorHandler from "../../services/customErrorHnadler.js";
import JwtService from "../../services/JwtService.js";
import { REFRESH_SECRET } from "../../config/index.js";


const refreshController = {
  async refresh(req, res, next) {
    const refreshSchema = Joi.object({
      refresh_token: Joi.string().required(),
    });

    const { error } = refreshSchema.validate(req.body);

    if (error) {
      return next(error);
    }

    //database check
    let refreshtoken;
    try {
      refreshtoken = await RefreshToken.findOne({
        token: req.body.refresh_token,
      });
      if (!refreshtoken) {
        return next(CustomErrorHandler.unAuthorized("Invalid refresh token"));
      }

      let userId;
      try {
        const { _id } = await JwtService.verify(
          refreshtoken.token,
          REFRESH_SECRET
        );

        userId = _id;
      } catch (error) {
        return next(CustomErrorHandler.unAuthorized("Invalid refresh token"));
      }

      const user = await User.findOne({ _id: userId });
      if (!user) {
        return next(CustomErrorHandler.unAuthorized("No user found"));
      }

      //Generate tokens
      const access_token = JwtService.sign({ _id: user._id, role: user.role });

      const refresh_token = JwtService.sign({ _id: user._id, role: user.role },'1Y',REFRESH_SECRET);

        // database whitelist

      await RefreshToken.create({token: refresh_token})

       res.json({access_token, refresh_token})

    } catch (error) {
      return next(new Error("Something went wrong" + error.message));
    }
  },
};

export default refreshController;
