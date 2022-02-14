require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const app = express();
const { Schema } = mongoose;

const port = process.env.PORT || 8000;
const dbURI = process.env.MONGODB_URI;

app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

const exerciseSessionSchema = new Schema({
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: String,
});

const userSchema = new Schema({
  username: { type: String, required: true },
  log: [exerciseSessionSchema],
});

const User = mongoose.model("User", userSchema);
const Session = mongoose.model("Session", exerciseSessionSchema);

mongoose
  .connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to Database"))
  .catch((error) => console.log(error));

const listener = app.listen(port, () => {
  console.log(`Your app is listening on port ${port}`);
  console.log(listener.address());
});
