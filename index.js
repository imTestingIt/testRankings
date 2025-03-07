"use strict";

// Chargement des modules
var express = require("express");
const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const axios = require("axios");
const jsdom = require("jsdom");
const got = require("got");
const { JSDOM } = jsdom;

const { chromium } = require("playwright");

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

/**PUPPETEER */
var browser;
async function championshipRankingsScrap(championship) {
  let url =
    championship == "ALMS"
      ? "https://www.asianlemansseries.com/calendar/2024-2025/teams-championship"
      : "";

  if (!browser) {
    browser = await puppeteer.launch({ headless: true });
  }

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

  return infos;
}
async function liveStandingsScrap(championship) {
  let url =
    championship == "ALMS"
      ? "https://live.asianlemansseries.com/en/replay/7638"
      : "";

  if (!browser) {
    browser = await puppeteer.launch({ headless: true });
  }
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

  return [
    { class: "LMP2", cars: LMP2 },
    { class: "LMP3", cars: LMP3 },
    { class: "GT", cars: GT },
  ];
}

/**CHEERIO */
async function fetchCurrentChampionshipStandings() {
  let url =
    "https://www.asianlemansseries.com/calendar/2024-2025/teams-championship";
  try {
    const { data } = await axios.get(url);
    console.log(`Fetched from network: ${url}`);

    return await extractCurrentChampionshipStandings(data);
  } catch (error) {
    console.error("Error fetching the HTML:", error);
    throw error;
  }
}
async function extractCurrentChampionshipStandings(html) {
  const $ = cheerio.load(html);
  const rows = [];

  $(".row").each((index, element) => {
    const pos = $(element).find(".pos").text().trim();
    const number = $(element).find(".number").text().trim().replace(/#/g, "");
    const team = $(element).find(".team").text().trim();
    const car = $(element).find(".car").text().trim();
    const cat = $(element).find(".cat").text().trim();
    const pts = $(element).find(".pts").text().trim();
    if (pos == "" || team == "") {
    } else {
      let row = {
        position: pos,
        number: number,
        team: team,
        car: car,
        category: cat,
        point: pts,
      };
      rows.push(row);
    }
  });

  console.log(JSON.stringify(rows));
  return rows;
}

/**PLAYWRIGHT */
async function fetchLiveStandings() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  let LMP2 = [];
  let LMP3 = [];
  let GT = [];
  try {
    // Navigation vers la page
    await page.goto("https://live.asianlemansseries.com/en/replay/7638", {
      waitUntil: "networkidle",
    });

    // Attente du chargement du tableau des résultats
    await page.waitForSelector(".openTeamModal", { timeout: 10000 });

    // Extraction des données
    const results = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll(".openTeamModal"));
      return rows.map((row) => {
        const cells = row.querySelectorAll("td");
        return {
          pos: cells[0]?.textContent.trim(),
          number: cells[1]?.textContent.trim(),
          classs: cells[3]?.textContent.trim(),
        };
      });
    });

    for (let i = 0; i < results.length; i++) {
      let info = {
        position: results[i].pos,
        number: results[i].number,
        class: results[i].classs,
      };

      if (results[i].classs == "LM P2") {
        LMP2.push(info);
      } else {
        if (results[i].classs == "LM P3") {
          LMP3.push(info);
        } else {
          GT.push(info);
        }
      }
    }

    /*
    results.forEach((result, index) => {
      console.log(`\nLigne ${index + 1}:`);
      console.log(`Position: ${result.position}`);
      console.log(`Numéro: ${result.carNumber}`);
      console.log(`Équipe: ${result.team}`);
      console.log(`Pilotes: ${result.drivers}`);
    });
*/
  } catch (error) {
    console.error("Erreur lors du scraping:", error);
  } finally {
    // Fermeture du navigateur
    await browser.close();
  }

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

      let championshipRankings = await fetchCurrentChampionshipStandings();

      callback(championshipRankings);
      console.log("getCurrentChampionshipStandings done index js");
    }
  );

  socket.on("getLiveStandings", async (championship, callback) => {
    console.log("getLiveStandings clicked");

    let liveStandings = await fetchLiveStandings();

    callback(liveStandings);
  });
});
