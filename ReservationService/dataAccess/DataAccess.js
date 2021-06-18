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
    // this.VaccinationPeriod = sequelize.define(
    //   "Slot",
    //   {
    //     vaccinationPeriodId: { type: Sequelize.INTEGER },
    //     turn: { type: Sequelize.INTEGER },
    //     date: { type: Sequelize.DATE },
    //     availableSlots: { type: Sequelize.INTEGER },
    //     totalSlots: { type: Sequelize.INTEGER },
    //     zoneId: { type: Sequelize.INTEGER },
    //     zoneName: { type: Sequelize.STRING },
    //     stateName: { type: Sequelize.STRING },
    //     stateId: { type: Sequelize.INTEGER },
    //     vacCenterId: { type: Sequelize.INTEGER },
    //   },
    //   {
    //     freezeTableName: true,
    //   }
    // );
    this.State = sequelize.define(
      "State",
      {
        name: { type: Sequelize.STRING },
      },
      {
        freezeTableName: true,
      }
    );
    this.Zone = sequelize.define(
      "Zone",
      {
        stateId: {
          type: Sequelize.INTEGER,
          references: {
            model: "State",
            key: "id",
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
        availableSlots: { type: Sequelize.INTEGER },
        totalSlots: { type: Sequelize.INTEGER },
        zoneName: { type: Sequelize.STRING },
        stateName: { type: Sequelize.STRING },
        //PKs
        date: { type: Sequelize.DATE, primaryKey: true },
        turn: { type: Sequelize.INTEGER, primaryKey: true },
        stateId: {
          type: Sequelize.INTEGER,
          references: {
            model: "State",
            key: "id",
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
    await this.State.sync({ force: false });
    await this.Slot.sync({ force: false });
    // await this.VaccinationPeriod.sync({ force: false });
    // await this.VacCenter.sync({ force: false });
  }

  updateSlot(data) {
    //This method is supposed to make a big update query that finds the wanted slot
    this.Slot.create({
      turn: 0,
      stateId: 3,
    })
      .then((data) => data.getDataValue("id"))
      .catch((e) => null);
  }

  async initialize() {
    // create db if it doesn't already exist
    const { host, port, user, password, database } = config;
    const connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
    });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
    this.createTables();
  }
};
