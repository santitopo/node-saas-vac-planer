const Queue = require("bull");
const {
  reservationQueryMQ,
  vaccinationQueryMQ,
  concurrentMQProcessing,
} = require("../config.json");
const resQueryMQ = new Queue(reservationQueryMQ);

const add = (reservation) => {
  return resQueryMQ
    .add(reservation, { removeOnComplete: true })
    .then(() => console.log("Enviado a MQ"));
};

add({ state_code: 4, zone_code: 1, assigned: true });
