module.exports = class ResQueryProcessor {
  constructor(queryDataAccess) {
    this.queryDataAccess = queryDataAccess;
  }

  process = async (job, done) => {
    /*
    TODO
    This method receives {state_code , zone_code , assigned}. Should be sent in the case
    that the reservation was reallocated (Realocattion), or if the reservation wasn't confirmed (ConfirmReservation Service)
    */
    console.log("processing a new Reservation MQObject");
    let res = job.data;
    await this.queryDataAccess.updateOrCreatePendingReservation(
      res.state_code,
      res.zone_code,
      res.assigned
    );
    done();
  };
};
