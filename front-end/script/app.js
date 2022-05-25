'use strict';

const lanIP = `${window.location.hostname}:5000`;
const socket = io(`http://${lanIP}`);
//#region ***  DOM references                           ***********  
//#endregion

const listenToUI = function () {};
//#region ***  Callback-Visualisation - show___         ***********
const showHistoriek = function(jsonObject) {
  console.log(jsonObject);
};

const showRealtime = function(jsonObject) {
  const HTMLsensor = document.querySelector('.js-sensors');
  const arrsensors = jsonObject.sensoren;
  HTMLsensor.innerHTML = `<p>temperatuur ${arrsensors.temp} C   lichtsterkte: ${arrsensors.licht} lux   windsterkte: ${arrsensors.wind} m/s</p>`;
};
//#endregion

//#region ***  Callback-No Visualisation - callback___  ***********
//#endregion

//#region ***  Data Access - get___                     ***********
const getHistoriek = function () {
  handleData(`http://192.168.168.169:5000/api/v1/historiek/`, showHistoriek);
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