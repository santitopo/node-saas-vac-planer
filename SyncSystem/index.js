const {
  reservationQueryMQ,
  vaccinationQueryMQ,
  concurrentMQProcessing,
} = require("../config.json");
const amountofInstances = parseInt(concurrentMQProcessing, 10);
const ResQueryProcessor = require("./resQueryProcessor");
const QueryDataAccess = require("./dataAccess/QueryDataAccess");
const VacQueryProcessor = require("./vacQueryProcessor");
const queryDataAccess = new QueryDataAccess();
const resQueryProcessor = new ResQueryProcessor(queryDataAccess);
const vacQueryProcessor = new VacQueryProcessor(queryDataAccess);

//Define queues to receive given vaccines and new reservations
const Queue = require("bull");
const resQueryMQ = new Queue(reservationQueryMQ);
const vacQueryMQ = new Queue(vaccinationQueryMQ);
/* Every time there is a new message in the MQ, these adapt the
entities and adds then to the queryDB */
resQueryMQ.process(amountofInstances, resQueryProcessor.process);
vacQueryMQ.process(amountofInstances, vacQueryProcessor.process);

resQueryMQ.on("completed", () => {
  console.log("ReservationReservationMQObject processed correctly");
});
resQueryMQ.on("stalled", () => {
  console.log("ReservationReservationMQObject became stalled");
});

vacQueryMQ.on("completed", () => {
  console.log("VaccineMQObject processed correctly");
});
vacQueryMQ.on("stalled", () => {
  console.log("VaccineMQObject became stalled");
});
