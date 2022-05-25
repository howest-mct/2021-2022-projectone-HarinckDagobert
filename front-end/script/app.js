'use strict';

const lanIP = `${window.location.hostname}:5000`;
const socket = io(`${lanIP}`);
//#region ***  DOM references                           ***********  
//#endregion

const listenToUI = function () {
  const btn = document.querySelector('.js-scherm-button');
  btn.addEventListener("click", function () {
    socket.emit("F2B_switch_scherm");
  })
};
//#region ***  Callback-Visualisation - show___         ***********
const showHistoriek = function(jsonObject) {
  console.log(jsonObject);
};

const showRealtime = function(jsonObject) {
  const htmlsensor = document.querySelector('.js-sensors');
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
    showRealtime(jsonObject)
  });

};
//#endregion

//#region ***  Init / DOMContentLoaded                  ***********
const init = function () {
  console.info("DOM geladen");
  listenToUI();
  listenToSocket();
  getHistoriek();
}

document.addEventListener("DOMContentLoaded", init);
//#endregion