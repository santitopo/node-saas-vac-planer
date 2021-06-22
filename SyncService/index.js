const {
  reservationQueryMQ,
  vaccinationQueryMQ,
  concurrentMQProcessing,
} = require("../config.json");
const amountofInstances = parseInt(concurrentMQProcessing, 10);
const ResQueryProcessor = require("../SyncService/resQueryProcessor");
const QueryDataAccess = require("../SyncService/dataAccess/QueryDataAccess");
const VacQueryProcessor = require("../SyncService/vacQueryProcessor");
const resQueryProcessor = new ResQueryProcessor(new QueryDataAccess());
const vacQueryProcessor = new VacQueryProcessor(new QueryDataAccess());

//Define queues to receive given vaccines and new reservations
const Queue = require("bull");
const resQueryMQ = new Queue(reservationQueryMQ);
const vacQueryMQ = new Queue(vaccinationQueryMQ);
/* Every time there is a new message in the MQ, these adapt the
entities and adds then to the queryDB */
resQueryMQ.process(amountofInstances, resQueryProcessor.process);
vacQueryMQ.process(amountofInstances, vacQueryProcessor);
