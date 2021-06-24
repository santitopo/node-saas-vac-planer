module.exports = class StateController {
  constructor(countryDataAcces, logger) {
    this.logger = logger;
    this.countryDataAcces = countryDataAcces;
  }

  addStates(body) {
    return this.countryDataAcces.addState({
      code: body.code,
      name: body.name,
    });
  }

  getStates() {
    return this.countryDataAcces.getStates();
  }

  getAState(code) {
    return this.countryDataAcces.getAState(code);
  }

  deleteAState(code) {
    return this.countryDataAcces.deleteAState(code);
  }

  updateAState(code, name) {
    return this.countryDataAcces.updateAState(code, name);
  }
};
