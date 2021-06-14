const Queue = require('bull');

module.exports = class MQReservations {
  
  constructor() {
    this.queue = new Queue('Reservations');
  }

  add = (reservation) => {
    this.queue.add(reservation);
  };
};