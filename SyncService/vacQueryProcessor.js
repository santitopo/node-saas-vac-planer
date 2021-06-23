module.exports = class VacQueryProcessor {
  constructor(queryDataAccess) {
    this.queryDataAccess = queryDataAccess;
  }

  process = async (job, done) => {
    /*
    TODO:
    This method receives a vaccineMQobject = {state_code, zone_code, age, turn, date}.
    Should be received every time a vaccine is given 
    */
    console.log("processing a new VaccineMQObject");
    try {
      let res = job.data;
      await this.queryDataAccess.updateVaccinesByStateAndZone(
        res.state_code,
        res.zone_code,
        res.age,
        res.date
      );
      await this.queryDataAccess.updateVaccinesByStateAndTurn(
        res.state_code,
        res.turn,
        res.date
      );
      done();
    } catch (e) {
      console.log("Error processing a VaccineMQObject: ", e);
      throw new Error("Error processing a VaccineMQObject");
    }
  };
};
