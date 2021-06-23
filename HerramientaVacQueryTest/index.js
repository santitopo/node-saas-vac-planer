const Queue = require("bull");
const { reservationQueryMQ, vaccinationQueryMQ } = require("../config.json");
const resQueryMQ = new Queue(reservationQueryMQ);
const vacQueryMQ = new Queue(vaccinationQueryMQ);

const addReservationUpdate = (reservation) => {
  return resQueryMQ
    .add(reservation, { removeOnComplete: true })
    .then(() => console.log("Enviado resObject a MQ"));
};

const addnewVaccine = (reservation) => {
  return vacQueryMQ
    .add(reservation, { removeOnComplete: true })
    .then(() => console.log("Enviado vacObject a MQ"));
};

addReservationUpdate({ state_code: 4, zone_code: 1, assigned: false });
for (var i = 0; i < 2000; i++) {
  addnewVaccine({
    state_code: Math.floor(Math.random() * (19 - 1)) + 1,
    zone_code: Math.floor(Math.random() * (55 - 1)) + 1,
    age: Math.floor(Math.random() * (99 - 15)) + 15,
    turn: Math.floor(Math.random() * (2 - 1)) + 2,
    date: new Date(`2020-10-${Math.floor(Math.random() * (31 - 1)) + 1}`),
  });
}
console.log("Terminé la carga");
