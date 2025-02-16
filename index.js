"use strict";

// Chargement des modules
var express = require("express");
const puppeteer = require("puppeteer");

var app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);

server.listen(8080, function () {
  console.log("Waiting for connection on port 8080...");
});

// Configuration d'express pour utiliser le répertoire "public"
app.use(express.static("public"));

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/public/liveChampionshipTest.html");
});

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function championshipRankingsScrap(championship) {
  let url =
    championship == "ALMS"
      ? "https://www.asianlemansseries.com/calendar/2024-2025/teams-championship"
      : "";

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url, {
    waitUntil: "domcontentloaded",
  });

  const positions = await page.$$eval(".row .cell.pos", (positions) => {
    return positions.map((position) => position.innerText);
  });

  const numbers = await page.$$eval(".row .cell.number", (numbers) => {
    return numbers.map((number) => number.innerText.replace(/#/g, ""));
  });

  const teams = await page.$$eval(".row .cell.team", (teams) => {
    return teams.map((team) =>
      team.innerText.replace(/\t/g, "").replace(/\n/g, "").trim()
    );
  });

  const cars = await page.$$eval(".row .cell.car", (cars) => {
    return cars.map((car) =>
      car.innerText.replace(/\t/g, "").replace(/\n/g, "").trim()
    );
  });

  const categories = await page.$$eval(".row .cell.cat", (categories) => {
    return categories.map((categorie) =>
      categorie.innerText.replace(/\t/g, "").replace(/\n/g, "").trim()
    );
  });

  const points = await page.$$eval(".row .cell.pts", (points) => {
    return points.map((point) => point.innerText);
  });

  let infos = [];
  for (let i = 0; i < teams.length; i++) {
    let info = {
      position: positions[i],
      number: numbers[i],
      team: teams[i],
      car: cars[i],
      category: categories[i],
      point: points[i],
    };

    infos.push(info);
  }
  await page.close();
  await browser.close();

  return infos;
}

async function liveStandingsScrap(championship) {
  let url =
    championship == "ALMS" ? "https://live.asianlemansseries.com/en/live" : "";

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url, {
    waitUntil: "domcontentloaded",
  });

  await page.waitForSelector(".openTeamModal");

  const positions = await page.$$eval(".openTeamModal .pos", (positions) => {
    return positions.map((position) => position.innerText);
  });

  const numbers = await page.$$eval(".openTeamModal .ranking", (numbers) => {
    return numbers.map((number) => number.innerText);
  });

  const classes = await page.$$eval(".openTeamModal .class", (classes) => {
    return classes.map((classe) => classe.innerText);
  });

  let LMP2 = [];
  let LMP3 = [];
  let GT = [];
  for (let i = 0; i < positions.length; i++) {
    let info = {
      position: positions[i],
      number: numbers[i],
      class: classes[i],
    };

    if (classes[i] == "LM P2") {
      LMP2.push(info);
    } else {
      if (classes[i] == "LM P3") {
        LMP3.push(info);
      } else {
        GT.push(info);
      }
    }
  }

  await page.close();
  await browser.close();

  return [
    { class: "LMP2", cars: LMP2 },
    { class: "LMP3", cars: LMP3 },
    { class: "GT", cars: GT },
  ];
}

io.on("connection", function (socket) {
  console.log("Un utilisateur s'est connecté.");

  socket.on(
    "getCurrentChampionshipStandings",
    async (championship, callback) => {
      console.log("getCurrentChampionshipStandings requested");
      let championshipRankings = await championshipRankingsScrap(championship);
      callback(championshipRankings);
      console.log("getCurrentChampionshipStandings done index js");
    }
  );

  socket.on("getLiveStandings", async (championship, callback) => {
    console.log("getLiveStandings clicked");

    let liveStandings = await liveStandingsScrap(championship);

    callback(liveStandings);
  });
});
