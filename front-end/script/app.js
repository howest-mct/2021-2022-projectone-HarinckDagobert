"use strict";

//#region ***  DOM references                           ***********
const lanIP = `${window.location.hostname}:5000`;
const socket = io(`${lanIP}`);
let htmlsensor, htmlhistoriekTemp, htmlform, htmlzonbtn, htmlparameters, htmldropdown, htmlformbtn, chart, meeteenheid;
//#endregion
//#region others
const DrawTempChartFirst = function (labels, data) {
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
    colors: ["#4BADF9"],
    grid: {
      show: true,
      borderColor: "#899299",
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
  chart = new ApexCharts(document.querySelector(".js-chart"), options);
  chart.render();
};
const UpdateChart = function (labels, data) {
  chart.updateOptions({
    series: [
      {
        name: meeteenheid,
        data: data,
      },
    ],
    labels: labels,
  });
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
  DrawTempChartFirst(converted_labels, converted_data);
};
const ShowUpdatedChart = function (jsonObject) {
  let converted_labels = [];
  let converted_data = [];
  for (const meting of jsonObject.historiek_device) {
    converted_labels.push(meting.datum);
    converted_data.push(meting.waarde);
  }
  UpdateChart(converted_labels, converted_data);
};

const showRealtime = function (jsonObject) {
  const arrsensors = jsonObject.sensoren;
  let waardeScherm;
  if (arrsensors.scherm == 1) {
    waardeScherm = "open";
  } else if (arrsensors.scherm == 0) {
    waardeScherm = "dicht";
  }
  htmlsensor.innerHTML = `<h2>Weersomstandigheden:</h2>
              <p>Wind:  ${arrsensors.wind} m/s</p>
              <p>Licht: ${arrsensors.licht} Lux</p>
              <p>Temp: ${arrsensors.temp} C°</p>
              <p>Scherm: ${waardeScherm}</p>`;
};

const showKnopstate = function () {
  console.log("scherm verandered");
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

const showDefaultValues = function () {
  document.querySelector(".js-form-wind").value = 6;
  document.querySelector(".js-form-licht").value = 2000;
  document.querySelector(".js-form-temp").value = 20;
  document.querySelector(".js-form-maandag").checked = false;
  document.querySelector(".js-form-dinsdag").checked = false;
  document.querySelector(".js-form-woensdag").checked = false;
  document.querySelector(".js-form-donderdag").checked = false;
  document.querySelector(".js-form-vrijdag").checked = true;
  document.querySelector(".js-form-zaterdag").checked = true;
  document.querySelector(".js-form-zondag").checked = true;
};
//#endregion

//#region ***  Callback-No Visualisation - callback___  ***********
const callbackUpdateForms = function () {
  window.location.href = "main.html";
};
//#endregion

//#region ***  Data Access - get___                     ***********
const getHistoriekWind = function () {
  meeteenheid = "m/s";
  document.querySelector(".js-dropdowntitel").innerHTML = "Windsterkte van vandaag:";
  handleData(`http://${lanIP}/api/v1/historiek/today/device/1/`, ShowUpdatedChart);
};

const getHistoriekLicht = function () {
  meeteenheid = "Lux";
  document.querySelector(".js-dropdowntitel").innerHTML = "Lichtsterkte van vandaag:";
  handleData(`http://${lanIP}/api/v1/historiek/today/device/2/`, ShowUpdatedChart);
};

const getHistoriekTemp = function () {
  meeteenheid = "Celsius";
  document.querySelector(".js-dropdowntitel").innerHTML = "Temperatuur van vandaag:";
  handleData(`http://${lanIP}/api/v1/historiek/today/device/3/`, ShowUpdatedChart);
};
const getHistoriekTempFirst = function () {
  handleData(`http://${lanIP}/api/v1/historiek/today/device/3/`, ShowTempChart);
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

const listenToUIforms = function () {
  htmlformbtn.addEventListener("click", function () {
    showDefaultValues();
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
  htmlformbtn = document.querySelector(".js-default-button");
  console.info("DOM geladen");
  if (htmlhistoriekTemp) {
    getHistoriekTempFirst();
    // listenToSocketHistoriek();
    listenToUI();
  } else if (htmlformbtn) {
    getParametersForm();
    listenToUIforms();
    listenToForm();
  }
};

document.addEventListener("DOMContentLoaded", init);
//#endregion
