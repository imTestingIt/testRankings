var pointsPerPosition = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

var additionnalPoints = [
  { number: 22, points: 1 },
  { number: 49, points: 1 },
  { number: 81, points: 1 },
];

var currentChampionshipRankings = [];
var currentLiveStandings = [];
var LMP2ChampionshipRankings = [];
var LMP3ChampionshipRankings = [];
var GTChampionshipRankings = [];

function comparePoints(a, b) {
  if (parseFloat(a.point) < parseFloat(b.point)) {
    return 1;
  }
  if (parseFloat(a.point) > parseFloat(b.point)) {
    return -1;
  }
  return 0;
}

document.addEventListener("DOMContentLoaded", async function () {
  let socket = io.connect();

  function load() {
    currentChampionshipRankings = JSON.parse(
      localStorage.getItem("currentChampionshipRankings") || "[]"
    );
    //console.log("cc : " + JSON.stringify(currentChampionshipRankings));
  }

  function updateLiveRankingsDisplay(category, rankings) {
    let liveRankingsTable = document.getElementById("liveRankings");
    for (let i = 0; i < rankings.length; i++) {
      liveRankingsTable.innerHTML +=
        '<tr><td><span class="cell' +
        category +
        '">' +
        category +
        "</span></td><td>" +
        (i + 1) +
        "</td><td>#" +
        rankings[i].number +
        "</td><td>" +
        rankings[i].team +
        '</td><td><span class="pointsValue">' +
        rankings[i].point +
        "</span></td></tr>";
    }
  }

  load();

  let getRankings = document.getElementById("getRankings");
  let getLiveStandings = document.getElementById("getLiveStandings");
  let selectedChampionship = document.getElementById(
    "selectedChampionship"
  ).value;

  getLiveStandings.onclick = function () {
    let liveRankingsTable = document.getElementById("liveRankings");
    liveRankingsTable.innerHTML =
      '<tr><th id="liveRankingsCategory">CATEGORY</th><th id="liveRankingsPosition">POS.</th><th id="liveRankingsNumber">CAR</th><th>TEAM</th><th id="liveRankingsPoints">POINTS</th></tr>';

    let data2 = document.getElementById("data2");

    data2.innerHTML = "Loading " + selectedChampionship + " live rankings...";
    socket.emit(
      "getLiveStandings",
      selectedChampionship,
      function (liveStandings) {
        currentLiveStandings = liveStandings;

        /*
        console.log(liveStandings[0].class);
        console.log(liveStandings[0].cars[0].position);
        
        for (let i = 0; i < liveStandings.length; i++) {
          data2.innerHTML += "<div>[" + liveStandings[i].class + "]</div>";

          for (let j = 0; j < liveStandings[i].cars.length; j++) {
            let car = liveStandings[i].cars[j];
            data2.innerHTML +=
              "<div>POS: " + car.position + " - #" + car.number + "</div>";
          }
        }
        */
        data2.innerHTML = "Loading completed";

        var updatedChampionshipStandings = structuredClone(
          currentChampionshipRankings
        );

        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 10; j++) {
            let currentCar = liveStandings[i].cars[j];
            if (currentCar == undefined) {
              continue;
            }

            const carToUpdate = updatedChampionshipStandings.find(
              (element) => element.number == currentCar.number
            );
            let indexOfCarToUpdate =
              updatedChampionshipStandings.indexOf(carToUpdate);

            carToUpdate.point =
              parseFloat(carToUpdate.point) + parseFloat(pointsPerPosition[j]);

            updatedChampionshipStandings[indexOfCarToUpdate] = carToUpdate;
          }
        }

        for (let k = 0; k < additionnalPoints.length; k++) {
          const carToUpdate = updatedChampionshipStandings.find(
            (element) => element.number == additionnalPoints[k].number
          );

          let indexOfCarToUpdate =
            updatedChampionshipStandings.indexOf(carToUpdate);

          carToUpdate.point =
            parseFloat(carToUpdate.point) +
            parseFloat(additionnalPoints[k].points);

          updatedChampionshipStandings[indexOfCarToUpdate] = carToUpdate;
        }

        LMP2ChampionshipRankings = [];
        LMP3ChampionshipRankings = [];
        GTChampionshipRankings = [];
        for (let k = 0; k < updatedChampionshipStandings.length; k++) {
          if (updatedChampionshipStandings[k].category == "LMP2") {
            LMP2ChampionshipRankings.push(updatedChampionshipStandings[k]);
          } else {
            if (updatedChampionshipStandings[k].category == "LMP3") {
              LMP3ChampionshipRankings.push(updatedChampionshipStandings[k]);
            } else {
              GTChampionshipRankings.push(updatedChampionshipStandings[k]);
            }
          }
        }

        LMP2ChampionshipRankings.sort(comparePoints);
        LMP3ChampionshipRankings.sort(comparePoints);
        GTChampionshipRankings.sort(comparePoints);

        /*
        console.log("updated P2: " + JSON.stringify(LMP2ChampionshipRankings));
        console.log("updated P3: " + JSON.stringify(LMP3ChampionshipRankings));
        console.log("updated GT: " + JSON.stringify(GTChampionshipRankings));
        */

        updateLiveRankingsDisplay("LMP2", LMP2ChampionshipRankings);
        updateLiveRankingsDisplay("LMP3", LMP3ChampionshipRankings);
        updateLiveRankingsDisplay("GT", GTChampionshipRankings);
      }
    );
  };

  getRankings.onclick = function () {
    let data = document.getElementById("data");

    data.innerHTML =
      "Loading " + selectedChampionship + " championship standings...";

    socket.emit(
      "lancerScrapping",
      selectedChampionship,
      function (championshipRankings) {
        //console.log(JSON.stringify(championshipRankings));
        currentChampionshipRankings = championshipRankings;
        /*
        data.innerHTML = "";
        for (let i = 0; i < championshipRankings.length; i++) {
          data.innerHTML +=
            "<div>[" +
            championshipRankings[i].category +
            "] " +
            championshipRankings[i].position +
            " - " +
            championshipRankings[i].team +
            " (" +
            championshipRankings[i].number +
            ") " +
            "  - " +
            championshipRankings[i].point +
            "pts ------ " +
            "</div>";
        }
        */
        data.innerHTML = "Loading completed";
        localStorage.setItem(
          "currentChampionshipRankings",
          JSON.stringify(currentChampionshipRankings)
        );
      }
    );
  };
});
