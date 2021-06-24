module.exports = class ResQueryProcessor {
  constructor(queryDataAccess) {
    this.queryDataAccess = queryDataAccess;
  }

  process = async (job, done) => {
    /*
    TODO:
    This method receives {state_code , zone_code , assigned}. 
    Should be received every time
    1. A reservation was reallocated (Realocattion)
    2. If the reservation wasn't confirmed (ConfirmReservation Service)
    */
    console.log("processing a new ReservationMQObject");
    try {
      let res = job.data;
      await this.queryDataAccess.updateOrCreatePendingReservation(
        res.state_code,
        res.zone_code,
        res.assigned
      );
      done();
    } catch (e) {
      console.log("Error processing a ReservationMQObject: ", e);
      throw new Error("Error processing a ReservationMQObject");
    }
  };
};
