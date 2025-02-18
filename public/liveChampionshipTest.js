var pointsPerPosition = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

var additionnalPoints = [
  { number: 22, points: 1 },
  { number: 49, points: 1 },
  { number: 2, points: 1 },
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
  }

  function updateLiveRankingsDisplay(category, rankings, table) {
    let tableSelector = "liveRankings " + table;
    let liveRankingsTable = document.getElementsByClassName(tableSelector)[0];
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

  async function getCurrentChampionshipStandings(selectedChampionship) {
    socket.emit(
      "getCurrentChampionshipStandings",
      selectedChampionship,
      function (championshipRankings) {
        currentChampionshipRankings = championshipRankings;

        localStorage.setItem(
          "currentChampionshipRankings",
          JSON.stringify(currentChampionshipRankings)
        );
      }
    );
  }

  load();

  let getLiveStandings = document.getElementById("getLiveStandings");
  let selectedChampionship = document.getElementById(
    "selectedChampionship"
  ).value;

  selectedChampionship = "ALMS";

  getLiveStandings.onclick = async function () {
    if (
      currentChampionshipRankings.length < 1 ||
      !currentChampionshipRankings
    ) {
      await getCurrentChampionshipStandings(selectedChampionship);
    } else {
    }

    let status = document.getElementById("requestStatus");
    status.innerHTML = "Chargement...";

    let liveRankingsTable = document.querySelectorAll(".liveRankings");
    for (let i = 0; i < liveRankingsTable.length; i++) {
      liveRankingsTable[i].innerHTML =
        '<tr><th id="liveRankingsCategory">CAT.</th><th id="liveRankingsPosition">POS.</th><th id="liveRankingsNumber">CAR</th><th>TEAM</th><th id="liveRankingsPoints">PTS.</th></tr>';
    }

    socket.emit(
      "getLiveStandings",
      selectedChampionship,
      function (liveStandings) {
        try {
          currentLiveStandings = liveStandings;

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

              console.log("ctu " + JSON.stringify(carToUpdate));

              carToUpdate.point =
                parseFloat(carToUpdate.point) +
                parseFloat(pointsPerPosition[j]);

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

          updateLiveRankingsDisplay("LMP2", LMP2ChampionshipRankings, "1");
          updateLiveRankingsDisplay("LMP3", LMP3ChampionshipRankings, "2");
          updateLiveRankingsDisplay("GT", GTChampionshipRankings, "3");

          status.innerHTML = "";
        } catch (error) {
          console.error(error);
          status.innerHTML = "Une erreur est survenue";
        }
      }
    );
  };
});
