"use strict";

//#region ***  DOM references                           ***********
const lanIP = `${window.location.hostname}:5000`;
const socket = io(`${lanIP}`);
let htmlsensor, htmlhistoriek, htmlform, htmlzonbtn, htmlparameters;
//#endregion

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
    html += `<li>${meting.datum}    ${type}:${waarde} </li>`;
    htmlhistoriek.innerHTML = html;
  }
};

const showRealtime = function (jsonObject) {
  const arrsensors = jsonObject.sensoren;
  let waardeScherm;
  console.log(arrsensors.scherm);
  if (arrsensors.scherm == 1) {
    waardeScherm = "open";
  } else if (arrsensors.scherm == 0) {
    waardeScherm = "dicht";
  }
  htmlsensor.innerHTML = `<p>temperatuur ${arrsensors.temp} C   lichtsterkte: ${arrsensors.licht} lux   windsterkte: ${arrsensors.wind} m/s  scherm: ${waardeScherm}</p>`;
};

const showParameters = function (jsonObject) {
  let html = "";
  let type;
  let waarde;
  for (const sensor of jsonObject.maxminWaarde) {
    if (sensor.parid == 1) {
      type = "maximum windsterkte";
      waarde = sensor.waarde + " m/s";
    } else if (sensor.parid == 2) {
      type = "minimum lichtsterkte";
      waarde = sensor.waarde + " lux";
    } else if (sensor.parid == 3) {
      type = "minimum temperatuur";
      waarde = sensor.waarde + " C°";
    } else if (sensor.parid == 4) {
      type = "weekdagen";
      waarde = "";
      if (sensor.waarde.includes("1")) {
        waarde += "maandag ";
      }
      if (sensor.waarde.includes("2")) {
        waarde += "dinsdag ";
      }
      if (sensor.waarde.includes("3")) {
        waarde += "woensdag ";
      }
      if (sensor.waarde.includes("4")) {
        waarde += "donderdag ";
      }
      if (sensor.waarde.includes("5")) {
        waarde += "vrijdag ";
      }
      if (sensor.waarde.includes("6")) {
        waarde += "vrijdag ";
      }
      if (sensor.waarde.includes("0")) {
        waarde += "zondag ";
      }
    }
    html += `<li>${type}: ${waarde}</li>`;
  }
  htmlparameters.innerHTML = html;
};
//#endregion

//#region ***  Callback-No Visualisation - callback___  ***********
const callbackUpdateForms = function () {
  window.location.href = "manage.html";
};
//#endregion

//#region ***  Data Access - get___                     ***********
const getHistoriek = function () {
  handleData(`http://${lanIP}/api/v1/historiek/`, showHistoriek);
};

const getParametersZon = function () {
  handleData(`http://${lanIP}/api/v1/device/`, showParameters);
};
//#endregion

//#region ***  Event Listeners - listenTo___            ***********
const listenToSocketHistoriek = function () {
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
const listenToSocketPar = function () {
  socket.on("B2F_new_parameters", function () {
    console.log("test");
    getParametersZon();
  });
};
const listenToForm = function () {
  const button = document.querySelector(".js-form-button");
  button.addEventListener("click", function () {
    const checkboxDagen = document.querySelectorAll(".js-form-dag");
    var formdagen = "";
    for (const dag of checkboxDagen) {
      if (dag.checked) {
        formdagen += dag.value;
      }
    }
    const jsonObject = JSON.stringify({
      waardewind: document.querySelector(".js-form-wind").value,
      waardelicht: document.querySelector(".js-form-licht").value,
      waardetemp: document.querySelector(".js-form-temp").value,
      dagen: formdagen,
    });
    console.log(jsonObject);
    handleData(`http://${lanIP}/api/v1/device/`, callbackUpdateForms, null, "PUT", jsonObject);
  });
};
const listenToButtonScherm = function () {
  htmlzonbtn.addEventListener("click", function () {
    console.log("click");
    socket.emit("F2B_switch_scherm");
  });
};
//#endregion

//#region ***  Init / DOMContentLoaded                  ***********
const init = function () {
  htmlsensor = document.querySelector(".js-sensors");
  htmlhistoriek = document.querySelector(".js-historiek");
  htmlform = document.querySelector(".js-form");
  htmlzonbtn = document.querySelector(".js-scherm-button");
  htmlparameters = document.querySelector(".js-parameters");
  console.info("DOM geladen");
  if (htmlhistoriek) {
    getHistoriek();
    listenToSocketHistoriek();
  } else if (htmlparameters) {
    getParametersZon();
    listenToButtonScherm();
    listenToSocketPar();
  } else if (htmlform) {
    listenToForm();
  }
};

document.addEventListener("DOMContentLoaded", init);
//#endregion
