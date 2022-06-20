"use strict";

//#region ***  DOM references                           ***********
const lanIP = `${window.location.hostname}:5000`;
const socket = io(`${lanIP}`);
let htmlhistoriekTemp, htmlform, htmlzonbtn, htmlzonslider, htmlparameters, htmldropdown, htmlformbtn, chart, gekozensensor;
//#endregion
//#region others
const DrawTempChartFirst = function (labels, data) {
  var options = {
    chart: {
      id: "TempChart",
      type: "line",
      width: "100%",
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
    xaxis: {
      type: "datetime",
      labels: {
        show: true,
        rotate: -90,
        rotateAlways: false,
        hideOverlappingLabels: true,
        style: {
          fontSize: "14px",
          fontFamily: "proxima-nova",
          colors: ["#2D3033"],
          fontWeight: 300,
        },
        datetimeUTC: false,
      },
    },
    yaxis: {
      type: "numeric",
      min: 15,
      max: 35,
      tickAmount: 4,
      labels: {
        show: true,
        hideOverlappingLabels: true,
        style: {
          fontSize: "14px",
          fontFamily: "proxima-nova",
          colors: ["#2D3033"],
          fontWeight: 300,
        },
      },
      title: {
        text: "celsius",
        style: {
          fontSize: "14px",
          fontFamily: "proxima-nova",
          colors: ["#2D3033"],
          fontWeight: 300,
        },
      },
    },
  };
  chart = new ApexCharts(document.querySelector(".js-chart"), options);
  chart.render();
};
const UpdateChartWind = function (labels, data) {
  chart.updateOptions({
    stroke: {
      curve: "smooth",
      width: 2.5,
    },
    series: [
      {
        name: "m/s",
        data: data,
      },
    ],
    labels: labels,
    yaxis: {
      min: 0,
      max: 20,
      tickAmount: 4,
      labels: {
        style: {
          fontSize: "14px",
          fontFamily: "proxima-nova",
          colors: ["#2D3033"],
          fontWeight: 300,
        },
      },
      title: {
        text: "m/s",
        style: {
          fontSize: "14px",
          fontFamily: "proxima-nova",
          colors: ["#2D3033"],
          fontWeight: 300,
        },
      },
    },
  });
};
const UpdateChartTemp = function (labels, data) {
  chart.updateOptions({
    stroke: {
      curve: "smooth",
      width: 2.5,
    },
    series: [
      {
        name: "celsius",
        data: data,
      },
    ],
    labels: labels,
    yaxis: {
      min: 10,
      max: 35,
      tickAmount: 5,
      labels: {
        style: {
          fontSize: "14px",
          fontFamily: "proxima-nova",
          colors: ["#2D3033"],
          fontWeight: 300,
        },
      },
      title: {
        text: "celsius",
        style: {
          fontSize: "14px",
          fontFamily: "proxima-nova",
          colors: ["#2D3033"],
          fontWeight: 300,
        },
      },
    },
  });
};
const UpdateChartLicht = function (labels, data) {
  chart.updateOptions({
    stroke: {
      curve: "smooth",
      width: 2.5,
    },
    series: [
      {
        name: "lux",
        data: data,
      },
    ],
    labels: labels,
    yaxis: {
      min: 0,
      max: 5000,
      tickAmount: 5,
      labels: {
        style: {
          fontSize: "14px",
          fontFamily: "proxima-nova",
          colors: ["#2D3033"],
          fontWeight: 300,
        },
      },
      title: {
        text: "lux",
        style: {
          fontSize: "14px",
          fontFamily: "proxima-nova",
          colors: ["#2D3033"],
          fontWeight: 300,
        },
      },
    },
  });
};

const UpdateChartScherm = function (labels, data) {
  chart.updateOptions({
    stroke: {
      curve: "stepline",
      width: 2.5,
    },
    series: [
      {
        name: "status",
        data: data,
      },
    ],
    labels: labels,
    yaxis: {
      min: 0,
      max: 1,
      tickAmount: 1,
      labels: {
        style: {
          fontSize: "14px",
          fontFamily: "proxima-nova",
          colors: ["#2D3033"],
          fontWeight: 300,
        },
      },
      title: {
        text: "status",
        style: {
          fontSize: "14px",
          fontFamily: "proxima-nova",
          colors: ["#2D3033"],
          fontWeight: 300,
        },
      },
    },
  });
};

//#endregion

//#region ***  Callback-Visualisation - show___         ***********

const ShowTempChart = function (jsonObject) {
  let converted_labels = [];
  let converted_data = [];
  for (const meting of jsonObject.historiek_device) {
    converted_labels.push(meting.datum);
    converted_data.push(meting.waarde);
  }
  DrawTempChartFirst(converted_labels, converted_data);
};
const ShowUpdatedChart = function (jsonObject) {
  console.log(jsonObject);
  let converted_labels = [];
  let converted_data = [];
  for (const meting of jsonObject.historiek_device) {
    converted_labels.push(meting.datum);
    converted_data.push(meting.waarde);
  }
  switch (gekozensensor) {
    case 1:
      UpdateChartWind(converted_labels, converted_data);
      break;
    case 2:
      UpdateChartLicht(converted_labels, converted_data);
      break;
    case 3:
      UpdateChartTemp(converted_labels, converted_data);
      break;
    case 4:
      UpdateChartScherm(converted_labels, converted_data);
      break;
  }
};

const showRealtime = function (jsonObject) {
  const arrsensors = jsonObject.sensoren;
  const btn = htmlzonslider;
  let waardeScherm;
  if (arrsensors.scherm == 1) {
    waardeScherm = "open";
    btn.checked = true;
  } else if (arrsensors.scherm == 0) {
    waardeScherm = "dicht";
    btn.checked = false;
  }
  document.querySelector(".js-sensor-wind").innerHTML = `${arrsensors.wind} m/s`;
  document.querySelector(".js-sensor-licht").innerHTML = `${arrsensors.licht} lux`;
  document.querySelector(".js-sensor-temp").innerHTML = `${arrsensors.temp} C°`;
  document.querySelector(".js-sensor-scherm").innerHTML = `${waardeScherm}`;
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
  document.querySelector(".js-form-wind").value = 10;
  document.querySelector(".js-form-licht").value = 2500;
  document.querySelector(".js-form-temp").value = 24;
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
  gekozensensor = 1;
  document.querySelector(".js-dropdowntitel").innerHTML = "Windsterkte van vandaag:";
  handleData(`http://${lanIP}/api/v1/historiek/today/device/1/`, ShowUpdatedChart);
};

const getHistoriekLicht = function () {
  gekozensensor = 2;
  document.querySelector(".js-dropdowntitel").innerHTML = "Lichtsterkte van vandaag:";
  handleData(`http://${lanIP}/api/v1/historiek/today/device/2/`, ShowUpdatedChart);
};

const getHistoriekTemp = function () {
  gekozensensor = 3;
  document.querySelector(".js-dropdowntitel").innerHTML = "Temperatuur van vandaag:";
  handleData(`http://${lanIP}/api/v1/historiek/today/device/3/`, ShowUpdatedChart);
};

const getHistoriekScherm = function () {
  gekozensensor = 4;
  document.querySelector(".js-dropdowntitel").innerHTML = "Status scherm van vandaag:";
  handleData(`http://${lanIP}/api/v1/historiek/today/device/4/`, ShowUpdatedChart);
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
      case "4":
        getHistoriekScherm();
        break;
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
      case "4":
        getHistoriekScherm();
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
  htmlhistoriekTemp = document.querySelector(".js-chart");
  htmlform = document.querySelector(".js-form");
  htmlzonbtn = document.querySelector(".js-scherm-button");
  htmlzonslider = document.querySelector(".js-scherm-slider");
  htmlparameters = document.querySelector(".js-parameters");
  htmldropdown = document.querySelector(".js-dropdown");
  htmlformbtn = document.querySelector(".js-default-button");
  console.info("DOM geladen");
  if (htmlhistoriekTemp) {
    getHistoriekTempFirst();
    listenToSocketHistoriek();
    listenToUI();
  } else if (htmlformbtn) {
    getParametersForm();
    listenToUIforms();
    listenToForm();
  }
};

document.addEventListener("DOMContentLoaded", init);
//#endregion
