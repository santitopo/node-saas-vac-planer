const Pipes = require("../pipeline/pipes");
const axios = require("axios");
const AssignmentCriterias = require("../services/assignmentCriterias");
const MQReservations = require("../communication/mqReservations");
const uniqid = require("uniqid");
var moment = require('moment');

module.exports = class ReservationController {
  constructor(countryDataAccess) {
    this.pipes = new Pipes();
    this.assignmentCriterias = new AssignmentCriterias();
    this.mq = new MQReservations();
    this.countryDataAccess = countryDataAccess;
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

  async sendReservationToMQ(person, slot, requestBody, reservationCode) {
    try {
      const mq_reservation = {
        phone: requestBody.phone,
        dni: person.DocumentId,
        reservationCode,
        assigned: slot ? true : false,
        vaccinationPeriodId: slot ? slot.vaccinationPeriodId : null,
        date: requestBody.reservationDate,
        turn: slot ? slot.turn : requestBody.turn,
      };
      await this.mq.add(mq_reservation);
    } catch {
      return "Error en la MQ";
    }
  }

  getValidCriterias(updatedCriterias, person) {
    const resultArray = updatedCriterias.map((f) => {
      if (f.function(person)) {
        return f.index;
      } else {
        return -1;
      }
    });
    return resultArray.filter((e) => e != -1);
  }

  parseDate(reservationDate){
      const newDate = moment(reservationDate);
      
      if(newDate.isValid()){
        const year  = newDate.year();
        const month = (newDate.month()+1).toString().length == 1 ? "0" + (newDate.month()+1) : (newDate.month()+1)
        const day = newDate.date().toString().length == 1 ? "0" + newDate.date() : newDate.date();
        
        const parsedDate = year + "-" + month + "-" + day;
        return parsedDate;
      }
      
  }

  async addReservation(body) {
    //Step 1 - Validators
    let err;
    err = this.runValidations(body);
    if (err) {
      return {
        status: err.status,
        body: err.body,
      };
    }
    //Step 2 - Request a Registro Civil (Deberian ser apis dinamicamente cargadas)
    const person = await this.fetchPerson(body.id);
    if (!person) {
      return { body: "No se encontró la cédula provista", status: 400 };
    }
    //Step 3 (Redis) - Aplicar todos los criterios de asignacion para obtener array con ids de criterios aplicables
    const updatedCriterias = this.assignmentCriterias.getUpdatedCriterias();

    const validCriterias = this.getValidCriterias(updatedCriterias, person);
    //Step 4 (SQL) - Update de cupo libre. Deberia devolver el slot
    const reservationDate = this.parseDate(body.reservationDate);
    if(!reservationDate){
      return {body: "Fecha mal provista", status: 400}
    }
    const slotData = await this.countryDataAccess.updateSlot({
      turn: body.turn,
      reservationDate: reservationDate,
      stateCode: body.stateCode,
      zoneCode: body.zoneCode,
      assignmentCriteriasIds: validCriterias,
    });
    console.log(slotData);
    // Step 5
    //Objeto MQ
    let reservationCode = uniqid();
    err = await this.sendReservationToMQ(
      person,
      slotData,
      body,
      reservationCode
    );
    if (err) {
      return {
        body: err,
        status: 500,
      };
    }
    // If pudo reservar ->  Retorno HTTP
    if (slotData) {
      return {
        body: {
          dni: person.id,
          reservationCode,
          state: body.stateCode,
          zone: body.zoneCode,
          vacCenterCode: slotData.vacCenterCode,
          vaccinationDate: reservationDate,
          turn: slotData.turn,
          timestampI: new Date(body.timestampI).toISOString(),
          timestampR: new Date(Date.now()).toISOString(),
          timestampD: Date.now() - new Date(body.timestampI) + " ms",
        },
        status: 200,
      };
    } else {
      return {
        body: {
          reservationCode,
          message: "La solicitud se asignara cuando se asignen nuevo cupos.", //sacar del config
          timestampI: new Date(body.timestampI).toISOString(),
          timestampR: new Date(Date.now()).toISOString(),
          timestampD: Date.now() - new Date(body.timestampI) + " ms",
        },
        status: 200,
      };
    }
  }

  init() {}
};
