"use strict";

//#region ***  DOM references                           ***********
const lanIP = `${window.location.hostname}:5000`;
const socket = io(`${lanIP}`);
let htmlsensor, htmlhistoriek;
//#endregion

const listenToUI = function () {
  const btn = document.querySelector(".js-scherm-button");
  btn.addEventListener("click", function () {
    console.log("click");
    socket.emit("F2B_switch_scherm");
  });
};
//#region ***  Callback-Visualisation - show___         ***********
const showHistoriek = function (jsonObject) {
  let html = "";
  let type;
  let waarde;
  for (const meting of jsonObject.historiek) {
    if (meting.deviceid == 1) {
      type = "windsterkte";
      waarde = meting.waarde + " m/s";
    } else if (meting.deviceid == 2) {
      type = "lichtsterkte";
      waarde = meting.waarde + " lux";
    } else if (meting.deviceid == 3) {
      type = "temperatuur";
      waarde = meting.waarde + " C°";
    } else if (meting.deviceid == 4) {
      type = "zonnescherm";
      if (meting.waarde == 1) {
        waarde = "gaat open";
      } else if (meting.waarde == 0) {
        waarde = "gaat dicht";
      }
    }
    html += `<li> datum:${meting.datum} ${type}:${waarde} </li>`;
    htmlhistoriek.innerHTML = html;
  }
};

const showRealtime = function (jsonObject) {
  const arrsensors = jsonObject.sensoren;
  htmlsensor.innerHTML = `<p>temperatuur ${arrsensors.temp} C   lichtsterkte: ${arrsensors.licht} lux   windsterkte: ${arrsensors.wind} m/s</p>`;
};
//#endregion

//#region ***  Callback-No Visualisation - callback___  ***********
//#endregion

//#region ***  Data Access - get___                     ***********
const getHistoriek = function () {
  handleData(`http://${lanIP}/api/v1/historiek/`, showHistoriek);
};
//#endregion

//#region ***  Event Listeners - listenTo___            ***********
const listenToSocket = function () {
  socket.on("connected", function () {
    console.log("verbonden met socket webserver");
  });

  socket.on("B2F_status_sensoren", function (jsonObject) {
    showRealtime(jsonObject);
  });

  socket.on("B2F_new_historiek", function () {
    console.log("new historiek");
    getHistoriek();
  });
};
//#endregion

//#region ***  Init / DOMContentLoaded                  ***********
const init = function () {
  console.info("DOM geladen");
  htmlsensor = document.querySelector(".js-sensors");
  htmlhistoriek = document.querySelector(".js-historiek");
  listenToUI();
  listenToSocket();
  getHistoriek();
};

document.addEventListener("DOMContentLoaded", init);
//#endregion
