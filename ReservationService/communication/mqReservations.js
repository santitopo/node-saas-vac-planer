const Queue = require("bull");

module.exports = class MQReservations {
  constructor() {
    this.queue = new Queue("Reservations");
  }

  add = async (reservation) => {
    return this.queue
      .add(reservation)
      .then(() => console.log(`${reservation.reservationCode} Enviado a MQ`));
  };
};
