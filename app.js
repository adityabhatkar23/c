const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const session = require("express-session");
const Confession = require("./models/confession");
require('dotenv').config();
const port = process.env.PORT ||4000
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(
  session({
    secret: "yourSecretKey",
    resave: false,
    saveUninitialized: true,
  })
);
app.set("view engine", "ejs");

const mongoURI = process.env.MONGODB_URI;

mongoose
  .connect(mongoURI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err));

app.get("/", async (req, res) => {
  try {
    const confessions = await Confession.find({ accepted: true }).sort({ dateSubmitted: -1 }).limit(2);

    res.render("index", { confessions});
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});
 
app.post("/submit", async (req, res) => {
  try {
    const { confessionText,to } = req.body;

    const wordCount = confessionText.trim().split(/\s+/).length;
    if (wordCount > 100) {
      return res.status(400).send("Confession cannot exceed 100 words."); // You can customize this response
    }

    const confession = new Confession({ confessionText,to});
    await confession.save();
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/moderator/login", (req, res) => {
  res.render("moderatorLogin");
});

app.post("/moderator/login", (req, res) => {
  const { password } = req.body;

  if (password === process.env.MODERATOR_PASS) {
    req.session.loggedIn = true;
    req.session.userId = "someUniqueUserId";
    res.redirect("/moderator");
  } else {
    res.redirect("/moderator/login");
  }
});

app.get("/moderator", async (req, res) => {
  if (!req.session.loggedIn) {
    return res.redirect("/moderator/login");
  }

  try {
    const confessions = await Confession.find({ accepted: false });

    res.render("moderatorDashboard", { confessions });
  } catch (err) {
    console.error("Error fetching confessions:", err);
    res.status(500).send("Internal Server Error");
  }
});
app.get("/moderator/agree", async (req, res) => {
  if (!req.session.loggedIn) {
    return res.redirect("/moderator/login");
  }

  try {
    const confessions = await Confession.find({ accepted: true });

    res.render("moderator", { confessions });
  } catch (err) {
    console.error("Error fetching confessions:", err);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/moderator/accept/:id", async (req, res) => {
  try {
    const confession = await Confession.findById(req.params.id);
    if (!confession) {
      console.error("Confession not found");
      return res.status(404).send("Confession not found");
    }
    confession.accepted = true;
    await confession.save();
    res.redirect("/moderator");
  } catch (err) {
    console.error("Error accepting confession:", err);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/moderator/reject/:id", async (req, res) => {
  try {
    await Confession.findByIdAndDelete(req.params.id);
    res.redirect("/moderator");
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
