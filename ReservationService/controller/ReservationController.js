const Pipes = require("../pipeline/pipes");
const axios = require("axios");

module.exports = class ReservationController {
  constructor() {
    this.pipes = new Pipes();
    this.init();
  }

  async fetchPerson(personId) {
    try {
      const response = await axios.get(
        "http://localhost:5006/people/" + personId
      );
      return response.data;
    } catch (error) {
      return null;
    }
  }

  runValidations(body) {
    const validationError = this.pipes.pipeline.run(body);
    if (validationError) {
      const err = {
        status: validationError.code,
        body: validationError.message,
      };
      return err;
    }
  }

  init() {}
};
