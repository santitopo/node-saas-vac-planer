const config = require("../../config.json");
//const mysql = require("mysql2/promise");
const { Client } = require("pg");
const { Sequelize } = require("sequelize");

module.exports = class CountryDataAccess {
  constructor() {
    this.initialize();
  }

  async createTables() {
    console.log("Connecting to Database...");
    await this.connectDB();
    const { host, port, user, password, database } = config;
    // connect to db
    this.sequelize = new Sequelize(
      `postgres://${user}:${password}@${host}:${port}/${database}`,
      { logging: false }
    );

    // init Models and add them with FK and PK restrictions to the db object
    this.Reservation = this.sequelize.define(
      "reservation",
      {
        dni: { type: Sequelize.STRING },
        phone: { type: Sequelize.STRING },
        reservation_code: { type: Sequelize.STRING, primaryKey: true },
        date: { type: Sequelize.DATE },
        assigned: { type: Sequelize.BOOLEAN },
        vaccination_period_id: {
          type: Sequelize.INTEGER,
          references: {
            model: "vaccination_period",
            key: "id",
          },
        },
        turn: { type: Sequelize.INTEGER },
      },
      {
        freezeTableName: true,
      }
    );
    this.AssignmentCriteria = this.sequelize.define(
      "assignment_criteria",
      {
        function: { type: Sequelize.STRING },
      },
      {
        freezeTableName: true,
      }
    );

    this.Vaccine = this.sequelize.define(
      "vaccine",
      {
        name: { type: Sequelize.STRING },
        recommendations: { type: Sequelize.STRING },
      },
      {
        freezeTableName: true,
      }
    );

    this.VaccinationPeriod = this.sequelize.define(
      "vaccination_period",
      {
        vaccine_amount: { type: Sequelize.INTEGER },
        date_from: { type: Sequelize.DATE },
        date_to: { type: Sequelize.DATE },
        vac_center_id: {
          type: Sequelize.INTEGER,
          references: {
            model: "vac_center",
            key: "id",
          },
        },
        assignment_criteria_id: {
          type: Sequelize.INTEGER,
          references: {
            model: "assignment_criteria",
            key: "id",
          },
        },
        vaccine_id: {
          type: Sequelize.INTEGER,
          references: {
            model: "vaccine",
            key: "id",
          },
        },
      },
      {
        freezeTableName: true,
      }
    );
    this.State = this.sequelize.define(
      "state",
      {
        code: { type: Sequelize.INTEGER, primaryKey: true },
        name: { type: Sequelize.STRING },
      },
      {
        freezeTableName: true,
      }
    );
    this.Zone = this.sequelize.define(
      "zone",
      {
        code: {
          type: Sequelize.INTEGER,
        },
        state_code: {
          type: Sequelize.INTEGER,
          references: {
            model: "state",
            key: "code",
          },
        },
        name: { type: Sequelize.STRING },
      },
      {
        freezeTableName: true,
      }
    );
    this.VacCenter = this.sequelize.define(
      "vac_center",
      {
        zone_id: {
          type: Sequelize.INTEGER,
          references: {
            model: "zone",
            key: "id",
          },
        },
        name: { type: Sequelize.STRING },
      },
      {
        freezeTableName: true,
      }
    );
    this.Slot = this.sequelize.define(
      "slot",
      {
        assignment_criteria_id: {
          type: Sequelize.INTEGER,
          references: {
            model: "assignment_criteria",
            key: "id",
          },
        },
        available_slots: { type: Sequelize.INTEGER },
        total_slots: { type: Sequelize.INTEGER },
        //PKs
        date: { type: Sequelize.DATE, primaryKey: true },
        turn: { type: Sequelize.INTEGER, primaryKey: true },
        state_code: {
          type: Sequelize.INTEGER,
          references: {
            model: "state",
            key: "code",
          },
          primaryKey: true,
        },
        vac_center_id: {
          type: Sequelize.INTEGER,
          references: {
            model: "vac_center",
            key: "id",
          },
          primaryKey: true,
        },
        zone_id: {
          type: Sequelize.INTEGER,
          references: {
            model: "zone",
            key: "id",
          },
          primaryKey: true,
        },
        vaccination_period_id: {
          type: Sequelize.INTEGER,
          references: {
            model: "vaccination_period",
            key: "id",
          },
          primaryKey: true,
        },
      },
      {
        freezeTableName: true,
      }
    );

    // Sync models with database
    await this.AssignmentCriteria.sync({ force: false });
    await this.Vaccine.sync({ force: false });
    await this.State.sync({ force: false });
    await this.Zone.sync({ force: false });
    await this.VacCenter.sync({ force: false });
    await this.VaccinationPeriod.sync({ force: false });
    await this.Reservation.sync({ force: false });
    await this.Slot.sync({ force: false });
  }
  async createTestData() {
    await this.Vaccine.create({
      name: "Phizer",
    });
    await this.State.create({
      name: "Montevideo",
      code: 1,
    });
    await this.Zone.create({
      code: 1,
      name: "Centro",
      state_code: 1,
    });
    await this.VacCenter.create({
      name: "Española",
      zone_id: 1,
    });
    await this.VaccinationPeriod.create({
      vaccine_amount: 300,
      date_from: new Date("01-02-2021"),
      date_to: new Date("03-03-2021"),
      vac_center_id: 1,
      assignment_criteria_id: 1,
      vaccine_id: 1,
    });
    await this.Reservation.create({
      dni: "49190954",
      phone: "098259045",
      reservation_code: "1RC",
      date: new Date(),
      assigned: true,
      vaccination_period_id: 1,
      turn: 1,
    });
    await this.Slot.create({
      assignment_criteria_id: 1,
      available_slots: 50,
      total_slots: 50,
      zone_name: "Centro",
      state_name: "Montevideo",
      date: new Date("12-12-2021"),
      turn: 1,
      state_code: 1,
      vac_center_id: 1,
      zone_id: 1,
      vaccination_period_id: 1,
    });
  }
  addCriteria(fun) {
    return this.AssignmentCriteria.create({
      function: JSON.stringify(fun),
    })
      .then((data) => data.getDataValue("id"))
      .catch((e) => null);
  }

  //POST
  async addState(state) {
    return await this.State.create({
      code: state.code,
      name: state.name,
    });
  }
  async addZone(zone) {
    return await this.Zone.create({
      code: zone.code,
      stateCode: zone.stateCode,
      name: zone.name,
    });
  }
  async addVacCenter(vacCenter) {
    return await this.VacCenter.create({
      zoneId: vacCenter.zoneId,
      name: vacCenter.name,
    });
  }
  async addVaccine(vaccine) {
    return await this.Vaccine.create({
      name: vaccine.name,
      recommendations: vaccine.recommendations,
    });
  }
  async addVaccinationPeriod(vaccinationPeriod) {
    let vp = await this.VaccinationPeriod.create({
      vaccineAmount: vaccinationPeriod.vaccineAmount,
      dateFrom: vaccinationPeriod.dateFrom,
      dateTo: vaccinationPeriod.dateTo,
      vacCenterId: vaccinationPeriod.vacCenterId,
      assignmentCriteriaId: vaccinationPeriod.assignmentCriteriaId,
      vaccineId: vaccinationPeriod.vaccineId,
    });
    return JSON.stringify(vp, null, 2);
  }
  async addSlot(slot) {
    return await this.Slot.create({
      assignmentCriteriaId: slot.assignmentCriteriaId,
      availableSlots: slot.availableSlots,
      totalSlots: slot.totalSlots,
      zoneName: slot.zoneName,
      stateName: slot.stateName,
      date: slot.date,
      turn: slot.turn,
      stateCode: slot.stateCode,
      vacCenterId: slot.vacCenterId,
      zoneId: slot.zoneId,
      vaccinationPeriodId: slot.vaccinationPeriodId,
    });
  }

  //GET ALL
  async getStates() {
    const states = await this.State.findAll();
    return JSON.stringify(states, null, 2);
  }
  async getZones() {
    const zones = await this.Zone.findAll();
    return JSON.stringify(zones, null, 2);
  }
  async getVacCenters() {
    const vacCenters = await this.VacCenter.findAll();
    return JSON.stringify(vacCenters, null, 2);
  }
  async getVaccines() {
    const vaccines = await this.Vaccine.findAll();
    return JSON.stringify(vaccines, null, 2);
  }
  async getVaccinationPeriods() {
    const vaccinationPeriods = await this.VaccinationPeriod.findAll();
    return JSON.stringify(vaccinationPeriods, null, 2);
  }
  async getSlots() {
    const slots = await this.Slot.findAll();
    return JSON.stringify(slots, null, 2);
  }

  //GET
  async getAState(code) {
    const states = await this.State.findAll({
      where: {
        code: code,
      },
    });
    return JSON.stringify(states, null, 2);
  }
  async getAZone(id) {
    const zones = await this.Zone.findAll({
      where: {
        id: id,
      },
    });
    return JSON.stringify(zones, null, 2);
  }
  async getAVacCenter(id) {
    const vacCenters = await this.VacCenter.findAll({
      where: {
        id: id,
      },
    });
    return JSON.stringify(vacCenters, null, 2);
  }
  async getAVaccine(id) {
    const vaccines = await this.Vaccine.findAll({
      where: {
        id: id,
      },
    });
    return JSON.stringify(vaccines, null, 2);
  }
  async getAVaccinationPeriod(id) {
    const vaccinationPeriods = await this.VaccinationPeriod.findAll({
      where: {
        id: id,
      },
    });
    return JSON.stringify(vaccinationPeriods, null, 2);
  }
  async getASlot(body) {
    const slots = await this.Slot.findAll({
      where: {
        date: body.date,
        turn: body.turn,
        vaccinationPeriodId: body.vaccinationPeriodId,
        zoneId: body.zoneId,
        vacCenterId: body.vacCenterId,
        stateCode: body.stateCode,
      },
    });
    return JSON.stringify(slots, null, 2);
  }

  //DELETE
  async deleteAState(code) {
    return await this.State.destroy({
      where: {
        code: code,
      },
    });
  }
  async deleteAZone(id) {
    return await this.Zone.destroy({
      where: {
        id: id,
      },
    });
  }
  async deleteAVacCenter(id) {
    return await this.VacCenter.destroy({
      where: {
        id: id,
      },
    });
  }
  async deleteAVaccine(id) {
    return await this.Vaccine.destroy({
      where: {
        id: id,
      },
    });
  }
  async deleteAVaccinationPeriod(id) {
    return await this.VaccinationPeriod.destroy({
      where: {
        id: id,
      },
    });
  }
  async deleteASlot(body) {
    return await this.Slot.destroy({
      where: {
        date: body.date,
        turn: body.turn,
        vaccinationPeriodId: body.vaccinationPeriodId,
        zoneId: body.zoneId,
        vacCenterId: body.vacCenterId,
        stateCode: body.stateCode,
      },
    });
  }

  //UPDATE
  async updateAState(code, newName) {
    return await this.State.update(newName, {
      where: {
        code: code,
      },
    });
  }
  async updateAZone(id, newName) {
    return await this.Zone.update(newName, {
      where: {
        id: id,
      },
    });
  }
  async updateAVacCenter(id, newName) {
    return await this.VacCenter.update(newName, {
      where: {
        id: id,
      },
    });
  }
  async updateAVaccine(id, newName) {
    return await this.Vaccine.update(newName, {
      where: {
        id: id,
      },
    });
  }
  async updateAVaccinationPeriod(id, newName) {
    return await this.VaccinationPeriod.update(newName, {
      where: {
        id: id,
      },
    });
  }
  async updateASlot(newName) {
    let update = {
      assignmentCriteriaId: newName.assignmentCriteriaId,
      availableSlots: newName.availableSlots,
      totalSlots: newName.totalSlots,
    };
    return await this.Slot.update(update, {
      where: {
        date: newName.date,
        turn: newName.turn,
        vaccinationPeriodId: newName.vaccinationPeriodId,
        zoneId: newName.zoneId,
        vacCenterId: newName.vacCenterId,
        stateCode: newName.stateCode,
      },
    });
  }

  async initialize() {
    // create db if it doesn't already exist
    const { database } = config;
    this.connection = new Client({
      user: "postgres",
      host: "localhost",
      password: "password",
      port: 5432,
    });
    await this.connection.connect();
    this.connection.query("SELECT datname FROM pg_database;", (err, res) => {
      if (res.rows.filter((d) => d.datname === database).length < 1) {
        console.log("Creating Database...");
        this.connection.query(`CREATE DATABASE ${database};`, async () => {
          this.createTables();
        });
      } else {
        this.createTables();
      }
    });
  }

  async connectDB() {
    const { database } = config;
    await this.connection.end();
    this.connection = new Client({
      user: "postgres",
      host: "localhost",
      password: "password",
      database: database,
      port: 5432,
    });
    await this.connection.connect();
  }
};
