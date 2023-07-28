const express = require("express");
const router = express.Router();
const decodeToken = require("../enyaresHelper/firebaseAuth");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const Score = require("../models/Score");
const PlayerScore = require("../models/PlayerScores");


router.post("/saveScoreboard", async function (req, res, next) {
  try {
    const { userScore } = req.body;
    const token = req.headers["x-access-token"];
    const decoded = jwt.decode(token);
    const { nickname, id, isPremiumUser } = decoded;

    console.log(decoded);
    if (decoded === -1) {
      return res.status(401).json({ msg: "Unauthorized" });
    }

    const user = await Score.findOne({ userId: id });
    if (user) {
      if (userScore > user.userScore) {
        user.userScore = userScore;
        await user.save();
      }
    } else {
      const score = new Score({
        userId: id,
        userScore,
        nickname: nickname,
        isPremiumUser
      });
      await score.save();
    }

    res.json({ msg: "Score saved successfully" });
  } catch (err) {
    console.log("hat2", err);
    res.status(500).json({ msg: "Error saving score" });
  }
});
router.post("/savePlayerScore", async function (req, res, next) {
  try {
    const { userScore } = req.body;
    const token = req.headers["x-access-token"];
    const decoded = jwt.decode(token);
    const { id, nickname } = decoded;

    if (decoded === -1) {
      return res.status(401).json({ msg: "Unauthorized" });
    }

    const playerScore = await PlayerScore.findOne({ userId: id });

    if (!playerScore) {
      
      const newPlayerScore = new PlayerScore({
        userId: id,
        nickname,
        topScores: [{ score: userScore }],
      });

      const savedPlayerScore = await newPlayerScore.save();
      res.json(savedPlayerScore);
    } else {
      
      let updatedTopScores = [...playerScore.topScores, { score: userScore }];
      updatedTopScores.sort((a, b) => b.score - a.score);
      updatedTopScores = updatedTopScores.slice(0, 5);

      playerScore.topScores = updatedTopScores;
      const updatedPlayerScore = await playerScore.save();
      res.json(updatedPlayerScore);

      
      const userScoreboard = await Score.findOne({ userId: id });
      if (!userScoreboard) {
        
        const newUserScoreboard = new Score({
          userId: id,
          nickname,
          userScore: Math.max(...updatedTopScores.map((item) => parseInt(item.score))),
        });
        await newUserScoreboard.save();
      } else {
        
        userScoreboard.userScore = Math.max(...updatedTopScores.map((item) => parseInt(item.score)));
        await userScoreboard.save();
      }
    }
  } catch (err) {
    console.log("Error:", err);
    res.status(500).json({ error: "An error occurred" });
  }
});
router.get("/userScores", async function (req, res, next) {
  try {
    const token = req.headers["x-access-token"];
    const decoded = jwt.decode(token);
    const { id } = decoded;

    const playerScore = await PlayerScore.findOne({ userId: id });

    if (!playerScore) {
      return res.status(404).json({ msg: "User not found" });
    }

    
    const allScores = playerScore.topScores.map((scoreObj) => scoreObj.score);

    res.json({ scores: allScores });
  } catch (err) {
    console.log("Error:", err);
    res.status(500).json({ error: "An error occurred" });
  }
});
module.exports = router;
