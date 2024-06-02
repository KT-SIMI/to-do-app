const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const session = require("express-session");
const MongoStore = require("connect-mongo")
const bcrypt = require("bcryptjs");
const User = require("./models/userModel");
const Task = require("./models/taskModel");
const { auth } = require("./middleware/auth");
const path = require('path')


require("dotenv").config();

(async () => {
  try {
    mongoose.connect(process.env.MONGO_URL);
    console.log(`DB connected`);
  } catch (err) {
    console.error("DB error:", err);
    process.exit(1);
  }
})();


const app = express();
const sessOption = {
  secret: process.env.SESSION_SECRET,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 72 * 60 * 60 * 1000,
  },
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_STORE,
    ttl: 400 * 60 * 60,
    autoRemove: "native",
  }),
};

const corsOptions = {
  origin: ["http://localhost:4008"],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.set("view engine", "ejs");
app.use(cors(corsOptions));
app.use(express.static(path.join(__dirname, 'public')));
// app.use(express.static('public'))
app.use(express.urlencoded({ extended: false }));
app.use(session(sessOption));



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
  res.render("index.ejs", {
    user: user,
    tasks: tasks
  });
});

app.post("/add-task", auth, async (req, res) => {
  const taskName = req.body.taskName;
  const dateTimeString = req.body.taskDay;

  const dateTime = new Date(Date.parse(dateTimeString))

  const day = dateTime.getDate()
  const month = dateTime.toLocaleString('default', { month: 'long' });
  const year = dateTime.getFullYear();
  const hours = String(dateTime.getHours()).padStart(2, '0');
  const minutes = String(dateTime.getMinutes()).padStart(2, '0');

  const ordinalSuffix = (n) => {
    const s = ["th", "st", "nd", "rd"],
      v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const formattedDate = `${ordinalSuffix(day)} of ${month}, ${year} at ${hours}:${minutes}`;

  const task = new Task({
    user_id: req.user.userId,
    name: taskName,
    dateTime,
    taskTime: formattedDate
  });

  await task.save();

  res.redirect("/");
});

const port = 4008;

app.listen(4008, () => {
  console.log(`Server started on port ${port}`);
});

app.get("/update-task/:taskId", auth, async (req, res) => {
  const taskId = req.params.taskId
  const task = await Task.findOne({ _id: taskId })

  if (task.isComplete === false) {
    await Task.updateOne({ _id: taskId }, {
      isComplete: true
    })

  } else {
    await Task.updateOne({ _id: taskId }, {
      isComplete: false
    })
  }
  res.redirect('/')

})

app.get("/delete-task/:taskId", auth, async (req, res) => {
  const taskId = req.params.taskId

  await Task.deleteOne({ _id: taskId })

  res.redirect('/')
})