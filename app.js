const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
// const bodyParser = require("body-parser");
const session = require("express-session");
const MongoStore = require("connect-mongo")(session);
const bcrypt = require("bcryptjs");
const User = require("./models/userModel");
const Task = require("./models/taskModel");
const { auth } = require("./middleware/auth");
// const cookieParser = require('cookie-parser')

require("dotenv").config();

(async () => {
  try {
    mongoose.connect(process.env.MONGO_URL);
    console.log(`DB connected`);
  } catch (err) {
    console.log("DB error :::::::", err);
    process.exit(1);
  }
})();

const app = express();
const sessOption = {
  secret: process.env.SESSION_SECRET,
  // proxy: true,
  cookie: {
    // sameSite: "none",
    secure: false,
    httpOnly: true,
    maxAge: 72 * 60 * 60 * 1000, //3 days
  },
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_STORE,
    ttl: 400 * 60 * 60,
  // store: MongoStore.create({
  //   mongoUrl: process.env.MONGO_STORE,
  //   ttl: 14 * 24 * 60 * 60,
  //   autoRemove: "native",
  //   // db: 'myappsession',
  //   // clear_interval: 3600
   }),
};

// sessOption.cookie.secure = false;

const corsOptions = {
  origin: ["http://localhost:3003"],
  credentials: true,
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  // methods: ['POST', 'PUT', 'GET', 'OPTIONS', 'HEAD', 'DELETE'],
  // exposedHeaders: ["set-cookie"]
};

app.use(cors(corsOptions));
// app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session(sessOption));
app.set("view engine", "ejs");
// app.use(bodyParser.urlencoded({ extended: true }));

app.get("/logout", (req, res) => {
  req.session.token = null;
  req.session.save(function (err) {
    if (err) next(err);

    req.session.regenerate(function (err) {
      if (err) next(err);

      res.redirect("/login");
    });
  });
});

app.get("/signup", (req, res) => {
  res.render("signup.ejs");
});

app.post("/signup", (req, res) => {
  const firstname = req.body.firstname;
  const lastname = req.body.lastname;
  const email = req.body.email;
  const password = req.body.password;

  const hashedPassword = bcrypt.hashSync(
    password,
    parseInt(process.env.PWD_HASH_LENGTH)
  );
  const user = new User({
    firstname: firstname,
    lastname: lastname,
    fullname: `${firstname} ${lastname}`,
    email: email,
    password: hashedPassword,
  });

  user.save();
  res.redirect("/login");
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.post("/login", async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    alert("Invalid email and/or password");
    return res.status(400).render("/login");
  }

  const user = await User.findOne({ email });

  if (!user) {
    alert("Invalid email and/or password");
    return res.status(401).render("/signup");
  }

  const isPasswordValid = bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    alert("Invalid email and/or password");
    return res.status(401).render("/login");
  }

  const payload = { userId: user._id };
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "400h",
  });
  req.session.token = token;
  res.redirect("/");
});

app.get("/", auth, async (req, res) => {
  const UserId = req.user.userId;
  const user = await User.findOne({ _id: UserId });
  const tasks = await Task.find({ user_id: UserId });
  res.render("index.ejs", { user: user, tasks: tasks });
});

app.post("/add-task", auth, async (req, res) => {
  const taskName = req.body.taskName;
  const day = req.body.taskDay;

  const task = new Task({
    user_id: req.user.userId,
    name: taskName,
    day: day,
    isComplete: false,
  });

  await task.save();

  res.redirect("/");
});

// app.post("/update-task/:taskId", auth, async (req, res) => {
//   const taskId = req.params.taskId;
//   await Task.updateOne(
//     { _id: taskId },
//     {
//       isComplete: true,
//     }
//   );
//   res.redirect("/");
// });

// app.post("/delete-task/:taskId", auth, async (req, res) => {
//   const taskId = req.params.taskId;
//   console.log(req.params)
//   console.log(taskId);
//   await Task.deleteOne({ _id: taskId });
//   res.redirect("/");
// });

const port = 3003;

app.listen(3003, () => {
  console.log(`Server started on port ${port}`);
});
