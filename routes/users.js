const express = require("express");
const router = express.Router();
const decodeToken = require("../enyaresHelper/firebaseAuth");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const Score = require("../models/Score");
const { default: mongoose } = require("mongoose");


router.get("/", function (req, res, next) {
  res.json("ok");
});

router.post("/loginOrRegister", async function (req, res, next) {
  try {
    const { token } = req.body;
    const decoded = await decodeToken.decodeToken(token);
    if (decoded == -1) return res.status(401).json({ msg: "Unauthorized" });
    console.log(decoded);
    const { email, name } = decoded;
    let payload;
    const user = await User.findOne({ email });
    if (!user) {
      const newUser = User({
        nickname: name,
        email,
      });
      const newUserRes = await newUser.save();
      payload = { nickname: newUserRes?.nickname, id: newUserRes?._id, isPremiumUser: newUserRes?.isPremiumUser };
    } else {
      payload = { nickname: user?.nickname, id: user?._id, isPremiumUser: user?.isPremiumUser };
    }
    console.log(payload);
    const tokenRes = await jwt.sign(payload, req.app.get("api_secret_key"), {
      expiresIn: 72000,
    });
    return res.json({ token: tokenRes });
  } catch (err) {
    console.error(err);
    return res.json(err);
  }
});
router.get("/freeLeaderboard", async function (req, res, next) {
  try {
    
    const leaderboard = await Score.find().sort({ userScore: -1 }).limit(5);
    const simplifiedLeaderboard = leaderboard.map((player) => {
      return {
        userScore: player.userScore,
        nickname: player.nickname
      };
    });

    res.json(simplifiedLeaderboard);
  } catch (err) {
    res.json(err);
  }
});
router.get("/premiumLeaderboard", async function (req, res, next) {
  try {
    
    const leaderboard = await Score.find({ isPremiumUser: true }).sort({ userScore: -1 }).limit(3);
    const simplifiedLeaderboard = leaderboard.map((player) => {
      return {
        userScore: player.userScore,
        nickname: player.nickname
      };
    });

    res.json(simplifiedLeaderboard);
  } catch (err) {
    res.json(err);
  }
});
module.exports = router;