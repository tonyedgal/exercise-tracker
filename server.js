require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const app = express();
const { Schema } = mongoose;

const port = process.env.PORT || 8000;
const dbURI = process.env.MONGODB_URI;

app.use(cors());
app.use(morgan("dev"));
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

app.post(
  "/api/users",
  bodyParser.urlencoded({ extended: false }),
  (req, res) => {
    let newUser = new User({ username: req.body.username });

    newUser.save((error, savedUser) => {
      if (error) return error;
      let responseObject = {};
      responseObject["username"] = savedUser.username;
      responseObject["_id"] = savedUser.id;
      res.json(responseObject);
    });
  }
);

app.get("/api/users", (req, res) => {
  User.find({}, (error, arrayOfUsers) => {
    if (error) return error;
    res.json(arrayOfUsers);
  });
});

app.post(
  "/api/users/:_id/exercises",
  bodyParser.urlencoded({ extended: false }),
  (req, res) => {
    let newSession = new Session({
      description: req.body.description,
      duration: parseInt(req.body.duration),
      date: req.body.date,
    });

    if (newSession.date === "" || newSession.date === undefined) {
      newSession.date = new Date().toISOString().substring(0, 10);
    }

    User.findByIdAndUpdate(
      req.params._id,
      { $push: { log: newSession } },
      { new: true },
      (error, updatedUser) => {
        if (error) return error;
        let responseObject = {};
        responseObject["_id"] = updatedUser.id;
        responseObject["username"] = updatedUser.username;
        responseObject["date"] = new Date(newSession.date).toDateString();
        responseObject["description"] = newSession.description;
        responseObject["duration"] = newSession.duration;
        res.json(responseObject);
      }
    );
  }
);

app.get("/api/users/:_id/logs", (req, res) => {
  User.findById(req.params._id, (error, result) => {
    if (error) return error;
    let responseObject = result;

    if (req.query.from || req.query.to) {
      let fromDate = new Date(0);
      let toDate = new Date();

      if (req.query.from) {
        fromDate = new Date(req.query.from);
      }

      if (req.query.to) {
        toDate = new Date(req.query.to);
      }

      fromDate = fromDate.getTime();
      toDate = toDate.getTime();

      responseObject.log = responseObject.log.filter((session) => {
        let sessionDate = new Date(session.date).getTime();

        return sessionDate >= fromDate && sessionDate <= toDate;
      });
    }

    if (req.query.limit) {
      responseObject.log = responseObject.log.slice(0, req.query.limit);
    }

    responseObject["count"] = result.log.length;
    res.json(responseObject);
  });
});

mongoose
  .connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to Database"))
  .catch((error) => console.log(error));

const listener = app.listen(port, () => {
  console.log(listener.address());
});
