const axios = require("axios");
const Queue = require("bull");
const { vaccinationQueryMQ } = require("../../config.json");
module.exports = class VaccineController {
  constructor(countryDataAccess) {
    this.countryDataAccess = countryDataAccess;
    this.vacQueryMQ = new Queue(vaccinationQueryMQ);
  }

  async fetchAge(dni) {
    try {
      const person = await axios.get("http://localhost:5006/people/" + dni);
      const age =
        new Date().getFullYear() -
        new Date(person.data.DateOfBirth).getFullYear();
      return age;
    } catch (error) {
      return null;
    }
  }

  async dispatchVaccineAct(vaccineMQobject) {
    return this.vacQueryMQ
      .add(vaccineMQobject, { removeOnComplete: true })
      .then(() => Promise.resolve())
      .catch((e) => {
        console.log("Error sending vaccination to MQ");
        return e;
      });
  }

  async giveVaccine(body) {
    const { reservationCode, vac_center_code, dni, vaccinationDate } = body;
    if (dni && vaccinationDate && vac_center_code && reservationCode) {
      const reservation = await this.countryDataAccess.getAReservation(dni);
      if (!reservation) {
        return {
          body: "No existe reserva para la cédula provista",
          status: 400,
        };
      }
      let vaccinationPeriod =
        await this.countryDataAccess.getAVaccinationPeriod(
          reservation.vaccination_period_id
        );
      vaccinationPeriod = JSON.parse(vaccinationPeriod)[0];

      if (
        new Date(reservation.date.toDateString()).getTime() !==
          new Date(new Date(vaccinationDate).toDateString()).getTime() ||
        reservation.reservation_code !== reservationCode ||
        !reservation.assigned ||
        !vaccinationPeriod ||
        vaccinationPeriod.vac_center_id !== vac_center_code
      ) {
        return {
          body: "Los datos provistos no se corresponden con ninguna reserva",
          status: 400,
        };
      }
      const age = await this.fetchAge(dni);
      if (!age) {
        console.log("Error in registro civil api");
        return {
          body: "Error del sistema. Intentelo nuevamente",
          status: 500,
        };
      }
      const vaccineMQobject = {
        state_code: reservation.state_code,
        zone_code: reservation.zone_id,
        age,
        turn: reservation.turn,
        date: reservation.date,
      };
      const err = await this.dispatchVaccineAct(vaccineMQobject);
      if (err) {
        return {
          body: "Error del sistema. Intentelo nuevamente",
          status: 500,
        };
      }
      return {
        body: "Vacuna agregada exitosamente",
        status: 200,
      };
    } else {
      return {
        body: "No se enviaron los datos solicitados",
        status: 400,
      };
    }
  }

  addVaccines(body) {
    return this.countryDataAccess.addVaccine({
      name: body.name,
      recommendations: body.recommendations,
    });
  }

  getVaccines() {
    return this.countryDataAccess.getVaccines();
  }

  getAVaccine(id) {
    return this.countryDataAccess.getAVaccine(id);
  }

  deleteAVaccine(id) {
    return this.countryDataAccess.deleteAVaccine(id);
  }

  updateAVaccine(id, name) {
    return this.countryDataAccess.updateAVaccine(id, name);
  }
};
