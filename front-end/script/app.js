const lanIP = `${window.location.hostname}:5000`;
const socket = io(`http://${lanIP}`);

const clearClassList = function (el) {
  el.classList.remove("c-room--wait");
  el.classList.remove("c-room--on");
};

const listenToUI = function () {
  const knoppen = document.querySelectorAll(".js-power-btn");
  for (const knop of knoppen) {
    knop.addEventListener("click", function () {
      const id = this.dataset.idlamp;
      let nieuweStatus;
      if (this.dataset.statuslamp == 0) {
        nieuweStatus = 1;
      } else {
        nieuweStatus = 0;
      }
      //const statusOmgekeerd = !status;
      clearClassList(document.querySelector(`.js-room[data-idlamp="${id}"]`));
      document.querySelector(`.js-room[data-idlamp="${id}"]`).classList.add("c-room--wait");
      socket.emit("F2B_switch_light", { lamp_id: id, new_status: nieuweStatus });
    });
  }
};

const listenToSocket = function () {
  socket.on("connected", function () {
    console.log("verbonden met socket webserver");
  });

  socket.on("B2F_status_sensoren", function (jsonObject) {
    const HTMLsensor = document.querySelector('.js-sensors')
    arrsensors = jsonObject.sensoren
    HTMLsensor.innerHTML = `<p>temperatuur ${arrsensors.temp} C   lichtsterkte: ${arrsensors.licht} lux   windsterkte: ${arrsensors.wind} m/s</p>`
  });


  socket.on("B2F_verandering_lamp_from_HRDWR", function (jsonObject) {
    console.log(jsonObject)
  }) 

};

document.addEventListener("DOMContentLoaded", function () {
  console.info("DOM geladen");
  listenToUI();
  listenToSocket();
});
