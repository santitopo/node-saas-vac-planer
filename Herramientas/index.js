const Queue = require('bull');
const reservations = new Queue('Reservations');


reservations.process(async (job) => {
    //console.log(job.data);
  });