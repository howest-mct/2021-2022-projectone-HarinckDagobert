"use strict";

//#region ***  DOM references                           ***********
const lanIP = `${window.location.hostname}:5000`;
const socket = io(`${lanIP}`);
let htmlsensor, htmlhistoriekTemp, htmlform, htmlzonbtn, htmlparameters, htmldropdown;
//#endregion
//#region others
const showTempChartFirst = function (labels, data) {
  var options = {
    chart: {
      id: "TempChart",
      type: "line",
    },
    stroke: {
      curve: "smooth",
      width: 2.5,
    },
    dataLabels: {
      enabled: false,
    },
    series: [
      {
        name: "Celsius:",
        data: data,
      },
    ],
    labels: labels,
    noData: {
      text: "Loading...",
    },
  };
  let chart = new ApexCharts(document.querySelector(".js-chart"), options);
  chart.render();
};
const UpdateChart = function (labels, data, meeteenheid) {
  let chart = new ApexCharts(document.querySelector(".js-chart"), options);
  chart.updateSeries([
    {
      name: meeteenheid,
      data: data,
    },
  ]);
  chart.render();
};
//#endregion

//#region ***  Callback-Visualisation - show___         ***********

const ShowTempChart = function (jsonObject) {
  console.log(jsonObject);

  let converted_labels = [];
  let converted_data = [];
  for (const meting of jsonObject.historiek_device) {
    converted_labels.push(meting.datum);
    converted_data.push(meting.waarde);
  }
  drawTempChart(converted_labels, converted_data);
};

const showRealtime = function (jsonObject) {
  const arrsensors = jsonObject.sensoren;
  let waardeScherm;
  if (arrsensors.scherm == 1) {
    waardeScherm = "open";
  } else if (arrsensors.scherm == 0) {
    waardeScherm = "dicht";
  }
  htmlsensor.innerHTML = `<h2>Sensoren:</h2>
              <p>Wind:  ${arrsensors.wind} m/s</p>
              <p>Licht: ${arrsensors.licht} Lux</p>
              <p>Temp: ${arrsensors.temp} C°</p>
              <p>Scherm: ${waardeScherm}</p>`;
};

const showKnopstate = function (jsonObject) {
  console.log("scherm verandered");
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
        waarde += "zaterdag ";
      }
      if (sensor.waarde.includes("0")) {
        waarde += "zondag ";
      }
    }
    html += `<li>${type}: ${waarde}</li>`;
  }
  htmlparameters.innerHTML = html;
};

const showParametersForm = function (jsonObject) {
  for (const sensor of jsonObject.maxminWaarde) {
    if (sensor.parid == 1) {
      document.querySelector(".js-form-wind").value = sensor.waarde;
    } else if (sensor.parid == 2) {
      document.querySelector(".js-form-licht").value = sensor.waarde;
    } else if (sensor.parid == 3) {
      document.querySelector(".js-form-temp").value = sensor.waarde;
    } else if (sensor.parid == 4) {
      if (sensor.waarde.includes("1")) {
        document.querySelector(".js-form-maandag").checked = true;
      }
      if (sensor.waarde.includes("2")) {
        document.querySelector(".js-form-dinsdag").checked = true;
      }
      if (sensor.waarde.includes("3")) {
        document.querySelector(".js-form-woensdag").checked = true;
      }
      if (sensor.waarde.includes("4")) {
        document.querySelector(".js-form-donderdag").checked = true;
      }
      if (sensor.waarde.includes("5")) {
        document.querySelector(".js-form-vrijdag").checked = true;
      }
      if (sensor.waarde.includes("6")) {
        document.querySelector(".js-form-zaterdag").checked = true;
      }
      if (sensor.waarde.includes("0")) {
        document.querySelector(".js-form-zondag").checked = true;
      }
    }
  }
};
//#endregion

//#region ***  Callback-No Visualisation - callback___  ***********
const callbackUpdateForms = function () {
  window.location.href = "main.html";
};
//#endregion

//#region ***  Data Access - get___                     ***********
const getHistoriekWind = function () {
  handleData(`http://${lanIP}/api/v1/historiek/today/device/1/`, ShowTempChart);
};

const getHistoriekLicht = function () {
  handleData(`http://${lanIP}/api/v1/historiek/today/device/2/`, ShowTempChart);
};

const getHistoriekTemp = function () {
  handleData(`http://${lanIP}/api/v1/historiek/today/device/3/`, ShowTempChart);
};
const getHistoriekTempFirst = function () {
  handleData(`http://${lanIP}/api/v1/historiek/today/device/3/`, showTempChartFirst);
};

const getParametersZon = function () {
  handleData(`http://${lanIP}/api/v1/device/`, showParameters);
};

const getParametersForm = function () {
  handleData(`http://${lanIP}/api/v1/device/`, showParametersForm);
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
    getHistoriekTemp();
  });

  socket.on("B2F_new_scherm", function (jsonObject) {
    const btn = document.querySelector(".js-scherm-button");
    btn.classList.remove("c-scherm-button-off");
    btn.classList.remove("c-scherm-button-on");
    if (jsonObject.status == true) {
      btn.classList.add("c-scherm-button-on");
    } else if (jsonObject.status == false) {
      btn.classList.add("c-scherm-button-off");
    }
  });
};
const listenToSocketPar = function () {
  socket.on("B2F_new_parameters", function () {
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
const listenToUI = function () {
  htmlzonbtn.addEventListener("click", function () {
    socket.emit("F2B_switch_scherm");
  });
  htmldropdown.addEventListener("change", function () {
    console.log(htmldropdown.value);
    switch (htmldropdown.value) {
      case "1":
        getHistoriekWind();
        break;
      case "2":
        getHistoriekLicht();
        break;
      case "3":
        getHistoriekTemp();
        break;
    }
  });
};
//#endregion

//#region ***  Init / DOMContentLoaded                  ***********
const init = function () {
  htmlsensor = document.querySelector(".js-sensors");
  htmlhistoriekTemp = document.querySelector(".js-chart");
  htmlform = document.querySelector(".js-form");
  htmlzonbtn = document.querySelector(".js-scherm-button");
  htmlparameters = document.querySelector(".js-parameters");
  htmldropdown = document.querySelector(".js-dropdown");
  console.info("DOM geladen");
  if (htmlhistoriekTemp) {
    getHistoriekTempFirst();
    listenToSocketHistoriek();
    listenToUI();
  } else if (htmlparameters) {
    getParametersZon();
    listenToSocketPar();
  } else if (htmlform) {
    getParametersForm();
    listenToForm();
  }
};

document.addEventListener("DOMContentLoaded", init);
//#endregion
