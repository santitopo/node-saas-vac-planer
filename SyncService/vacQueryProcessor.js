module.exports = class VacQueryProcessor {
  constructor(queryDataAccess) {
    this.queryDataAccess = queryDataAccess;
  }

  process = async (job, done) => {
    console.log("processing a new Reservation MQObject");
    let res = job.data;
    // await this.queryDataAccess.updateOrCreatePendingReservation(
    //   res.state_code,
    //   res.zone_code,
    //   res.assigned
    // );
    done();
  };
};
