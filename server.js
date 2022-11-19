const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const MongoDBSession = require("connect-mongodb-session")(session);
const mongoose = require("mongoose");
const app = express();

app.use(express.json());

// const UserModel = require("./models/User");
const mongoURI = "mongodb://localhost:27017/sessions";

mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    // useCreateIndex: true,
    useUnifiedTopology: true,
  })
  .then((res) => {
    console.log("MongoDB Connected");
  });

const store = new MongoDBSession({
  uri: mongoURI,
  collection: "mySessions",
});

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: "key that will sign cookie",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

const isAuth = (req, res, next) => {
  if (req.session.isAuth) {
    next();
  } else {
    res.redirect("/login");
  }
};

app.get("/", (req, res) => {
  // req.session.isAuth = true;
  res.send("Data Send.....");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  console.log(req.body);
  const { email, password } = req.body;

  let user = await UserModel.findOne({ email });

  if (!user) {
    return (
      res
        // .status(401)
        // .send({ status: "error", message: "Invalid Username" })
        .redirect("/login")
    );
  }

  const validPassword = await bcrypt.compare(password, user.password);

  console.log("validPassword", validPassword);

  if (validPassword) {
    req.session.isAuth = true;
    return (
      res
        // send({ status: "Succes", message: "User LoggedIn" });
        .redirect("/dashboard")
    );
  } else {
    return (
      res
        // .status(401)
        // .send({ status: "error", message: "Invalid Username and Password" })
        .redirect("/login")
    );
  }
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  let user = await UserModel.findOne({ email });

  if (user) {
    return res.redirect("/register");
  }

  const hashedPsw = await bcrypt.hash(password, 12);

  user = new UserModel({
    username,
    email,
    password: hashedPsw,
  });

  await user.save();

  res.redirect("/login");
});

app.get("/dashboard", isAuth, (req, res) => {
  res.render("dashboard");
});

app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) throw err;
    res.redirect("/");
  });
});

app.listen(1030, () => {
  console.log("Server running......");
});
