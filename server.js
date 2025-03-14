import express from "express";
import { APP_PORT, DB_URL } from "./config";
import routes from "./routes/index.js";
import errorHandler from "./middlewares/errorHandler.js";
import mongoose from "mongoose";
import path from "path"

const app = express();


// database connection
mongoose.connect(DB_URL,{
  useCreateIndex:true,
  useNewUrlParser:true,
  useFindAndModify:false,
  useUnifiedTopology:true
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("DB connected...");
});

global.appRoot = path.resolve(__dirname)


app.use(express.urlencoded({extended: false}))
app.use(express.json());
app.use("/api", routes);
app.use('/uploads', express.static('uploads'))

app.use(errorHandler);
app.listen(APP_PORT, () => console.log(`server listing on port ${APP_PORT}.`));
