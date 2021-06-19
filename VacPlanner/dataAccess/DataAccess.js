const config = require("../../config.json");
const mysql = require("mysql2/promise");
const { Sequelize } = require("sequelize");

module.exports = class CountryDataAccess {
  constructor() {
    this.initialize();
  }

  async createTables() {
    const { host, port, user, password, database } = config;
    // connect to db
    const sequelize = new Sequelize(database, user, password, {
      dialect: "mysql",
      host: host,
      port: port,
    });

    // init Models and add them with FK and PK restrictions to the db object
    this.AssignmentCriteria = sequelize.define(
      "AssignmentCriteria",
      {
        function: { type: Sequelize.STRING },
      },
      {
        freezeTableName: true,
      }
    );

    this.Vaccine = sequelize.define(
      "Vaccine",
      {
        name: { type: Sequelize.STRING },
        recommendations: { type: Sequelize.STRING },
      },
      {
        freezeTableName: true,
      }
    );

    this.VaccinationPeriod = sequelize.define(
      "VaccinationPeriod",
      {
        vaccineAmount: { type: Sequelize.INTEGER },
        dateFrom: { type: Sequelize.DATE },
        dateTo: { type: Sequelize.DATE },
        vacCenterId: {
          type: Sequelize.INTEGER,
          references: {
            model: "VacCenter",
            key: "id",
          },
        },
        assignmentCriteriaId: {
          type: Sequelize.INTEGER,
          references: {
            model: "AssignmentCriteria",
            key: "id",
          },
        },
        vaccineId: {
          type: Sequelize.INTEGER,
          references: {
            model: "Vaccine",
            key: "id",
          },
        },
      },
      {
        freezeTableName: true,
      }
    );
    this.State = sequelize.define(
      "State",
      {
        code: { type: Sequelize.INTEGER, primaryKey: true },
        name: { type: Sequelize.STRING },
      },
      {
        freezeTableName: true,
      }
    );
    this.Zone = sequelize.define(
      "Zone",
      {
        code: {
          type: Sequelize.INTEGER,
        },
        stateCode: {
          type: Sequelize.INTEGER,
          references: {
            model: "State",
            key: "code",
          },
        },
        name: { type: Sequelize.STRING },
      },
      {
        freezeTableName: true,
      }
    );
    this.VacCenter = sequelize.define(
      "VacCenter",
      {
        zoneId: {
          type: Sequelize.INTEGER,
          references: {
            model: "Zone",
            key: "id",
          },
        },
        name: { type: Sequelize.STRING },
      },
      {
        freezeTableName: true,
      }
    );
    this.Slot = sequelize.define(
      "Slot",
      {
        assignmentCriteriaId: {
          type: Sequelize.INTEGER,
          references: {
            model: "AssignmentCriteria",
            key: "id",
          },
        },
        availableSlots: { type: Sequelize.INTEGER },
        totalSlots: { type: Sequelize.INTEGER },
        zoneName: { type: Sequelize.STRING },
        stateName: { type: Sequelize.STRING },
        //PKs
        date: { type: Sequelize.DATE, primaryKey: true },
        turn: { type: Sequelize.INTEGER, primaryKey: true },
        stateCode: {
          type: Sequelize.INTEGER,
          references: {
            model: "State",
            key: "code",
          },
          primaryKey: true,
        },
        vacCenterId: {
          type: Sequelize.INTEGER,
          references: {
            model: "VacCenter",
            key: "id",
          },
          primaryKey: true,
        },
        zoneId: {
          type: Sequelize.INTEGER,
          references: {
            model: "Zone",
            key: "id",
          },
          primaryKey: true,
        },
        vaccinationPeriodId: {
          type: Sequelize.INTEGER,
          references: {
            model: "VaccinationPeriod",
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
    await this.Slot.sync({ force: false });
    // await this.VaccinationPeriod.sync({ force: false });
    // await this.VacCenter.sync({ force: false });
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
      name: state.name
    })
  }
  async addZone(zone) {
    return await this.Zone.create({
      code: zone.code,
      stateCode: zone.stateCode,
      name: zone.name
    })
  }
  async addVacCenter(vacCenter) {
    return await this.VacCenter.create({
      zoneId: vacCenter.zoneId,
      name: vacCenter.name
    })
  }
  async addVaccine(vaccine) {
    return await this.Vaccine.create({
      name: vaccine.name,
      recommendations: vaccine.recommendations
    })
  }
  async addVaccinationPeriod(vaccinationPeriod) {
    let vp = await this.VaccinationPeriod.create({
      vaccineAmount: vaccinationPeriod.vaccineAmount,
      dateFrom: vaccinationPeriod.dateFrom,
      dateTo: vaccinationPeriod.dateTo,
      vacCenterId: vaccinationPeriod.vacCenterId,
      assignmentCriteriaId: vaccinationPeriod.assignmentCriteriaId,
      vaccineId: vaccinationPeriod.vaccineId
    })
    return JSON.stringify(vp, null, 2)
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
      vaccinationPeriodId: slot.vaccinationPeriodId
    })
  }

  //GET ALL
  async getStates() {
    const states = await this.State.findAll()
    return JSON.stringify(states, null, 2)
  }
  async getZones() {
    const zones = await this.Zone.findAll()
    return JSON.stringify(zones, null, 2)
  }
  async getVacCenters() {
    const vacCenters = await this.VacCenter.findAll()
    return JSON.stringify(vacCenters, null, 2)
  }
  async getVaccines() {
    const vaccines = await this.Vaccine.findAll()
    return JSON.stringify(vaccines, null, 2)
  }
  async getVaccinationPeriods() {
    const vaccinationPeriods = await this.VaccinationPeriod.findAll()
    return JSON.stringify(vaccinationPeriods, null, 2)
  }
  async getSlots() {
    const slots = await this.Slot.findAll()
    return JSON.stringify(slots, null, 2)
  }

  //GET
  async getAState(code) {
    const states = await this.State.findAll({
      where: {
        code: code
      }
    })
    return JSON.stringify(states, null, 2)
  }
  async getAZone(id) {
    const zones = await this.Zone.findAll({
      where: {
        id: id
      }
    })
    return JSON.stringify(zones, null, 2)
  }
  async getAVacCenter(id) {
    const vacCenters = await this.VacCenter.findAll({
      where: {
        id: id
      }
    })
    return JSON.stringify(vacCenters, null, 2)
  }
  async getAVaccine(id) {
    const vaccines = await this.Vaccine.findAll({
      where: {
        id: id
      }
    })
    return JSON.stringify(vaccines, null, 2)
  }
  async getAVaccinationPeriod(id) {
    const vaccinationPeriods = await this.VaccinationPeriod.findAll({
      where: {
        id: id
      }
    })
    return JSON.stringify(vaccinationPeriods, null, 2)
  }
  async getASlot(body) {
    const slots = await this.Slot.findAll({
      where: {
        date: body.date,
        turn: body.turn,
        vaccinationPeriodId: body.vaccinationPeriodId,
        zoneId:body.zoneId,
        vacCenterId: body.vacCenterId,
        stateCode:body.stateCode
      }
    })
    return JSON.stringify(slots, null, 2)
  }

  //DELETE
  async deleteAState(code) {
    return await this.State.destroy({
      where: {
        code: code
      }
    })
  }
  async deleteAZone(id) {
    return await this.Zone.destroy({
      where: {
        id: id
      }
    })
  }
  async deleteAVacCenter(id) {
    return await this.VacCenter.destroy({
      where: {
        id: id
      }
    })
  }
  async deleteAVaccine(id) {
    return await this.Vaccine.destroy({
      where: {
        id: id
      }
    })
  }
  async deleteAVaccinationPeriod(id) {
    return await this.VaccinationPeriod.destroy({
      where: {
        id: id
      }
    })
  }
  async deleteASlot(body) {
    return await this.Slot.destroy({
      where: {
        date: body.date,
        turn: body.turn,
        vaccinationPeriodId: body.vaccinationPeriodId,
        zoneId:body.zoneId,
        vacCenterId: body.vacCenterId,
        stateCode:body.stateCode
      }
    })
  }

  //UPDATE
  async updateAState(code, newName) {
    return await this.State.update(newName, {
      where: {
        code: code
      }
    })
  }
  async updateAZone(id, newName) {
    return await this.Zone.update(newName, {
      where: {
        id: id
      }
    })
  }
  async updateAVacCenter(id, newName) {
    return await this.VacCenter.update(newName, {
      where: {
        id: id
      }
    })
  }
  async updateAVaccine(id, newName) {
    return await this.Vaccine.update(newName, {
      where: {
        id: id
      }
    })
  }
  async updateAVaccinationPeriod(id, newName) {
    return await this.VaccinationPeriod.update(newName, {
      where: {
        id: id
      }
    })
  }
  async updateASlot(newName) {
    let update = {
      assignmentCriteriaId: newName.assignmentCriteriaId,
      availableSlots: newName.availableSlots,
      totalSlots: newName.totalSlots,

    }
    return await this.Slot.update(update, {
      where: {
        date: newName.date,
        turn: newName.turn,
        vaccinationPeriodId: newName.vaccinationPeriodId,
        zoneId:newName.zoneId,
        vacCenterId: newName.vacCenterId,
        stateCode:newName.stateCode
      }
    })
  }

  async initialize() {
    // create db if it doesn't already exist
    const { host, port, user, password, database } = config;
    this.connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
    });
    await this.connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${database}\`;`
    );
    this.createTables();
  }
};
