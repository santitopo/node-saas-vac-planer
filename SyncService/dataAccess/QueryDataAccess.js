const { Op, Sequelize } = require("sequelize");
const { Client } = require("pg");
const config = require("../../config.json");

module.exports = class QueryDataAccess {
  constructor() {
    this.initialize();
  }

  async updateVaccinesByStateAndTurn(state_code, turn, date) {
    const vacByStateAndTurn = await this.VaccinesByStateAndTurn.findOne({
      where: {
        [Op.and]: [{ state_code }, { turn }, { date }],
      },
    });
    if (!vacByStateAndTurn) {
      await this.VaccinesByStateAndTurn.create({
        state_code,
        turn,
        date,
        vaccine_amount: 1,
      });
    } else {
      await this.VaccinesByStateAndTurn.update(
        {
          vaccine_amount: vacByStateAndTurn.vaccine_amount + 1,
        },
        {
          where: {
            [Op.and]: [{ state_code }, { turn }, { date }],
          },
        }
      );
    }
  }

  async updateVaccinesByStateAndZone(state_code, zone_code, age, date) {
    const vacByStateAndZone = await this.VaccinesByStateAndZone.findOne({
      where: {
        [Op.and]: [{ state_code }, { zone_code }, { age }, { date }],
      },
    });
    if (!vacByStateAndZone) {
      await this.VaccinesByStateAndZone.create({
        state_code,
        zone_code,
        age,
        date,
        vaccine_amount: 1,
      });
    } else {
      await this.VaccinesByStateAndZone.update(
        {
          vaccine_amount: vacByStateAndZone.vaccine_amount + 1,
        },
        {
          where: {
            [Op.and]: [{ state_code }, { zone_code }, { age }, { date }],
          },
        }
      );
    }
    return;
  }

  async updateOrCreatePendingReservation(state_code, zone_code, assigned) {
    const pendingResModel = await this.PendingReservations.findOne({
      where: { [Op.and]: [{ state_code }, { zone_code }] },
    });
    if (!pendingResModel) {
      await this.PendingReservations.create({
        state_code,
        zone_code,
        pending_amount: 1,
      });
    } else {
      await this.PendingReservations.update(
        {
          pending_amount: assigned
            ? pendingResModel.pending_amount - 1
            : pendingResModel.pending_amount + 1,
        },
        {
          where: {
            state_code,
            zone_code,
          },
        }
      );
    }
    return;
  }

  async createTables() {
    console.log("Connecting to Database...");
    const { host, port, user, password, queryDatabase } = config;
    // connect to db
    this.sequelize = new Sequelize(
      `postgres://${user}:${password}@${host}:${port}/${queryDatabase}`,
      { logging: false }
    );

    // init Models and add them with FK and PK restrictions to the db object
    this.VaccinesByStateAndTurn = this.sequelize.define(
      "vaccines_by_state_and_turn",
      {
        state_code: { type: Sequelize.INTEGER, primaryKey: true },
        turn: { type: Sequelize.INTEGER, primaryKey: true },
        date: { type: Sequelize.DATEONLY, primaryKey: true },
        vaccine_amount: { type: Sequelize.INTEGER },
      },
      {
        freezeTableName: true,
      }
    );

    this.VaccinesByStateAndZone = this.sequelize.define(
      "vaccines_by_state_and_zone",
      {
        state_code: { type: Sequelize.INTEGER, primaryKey: true },
        zone_code: { type: Sequelize.INTEGER, primaryKey: true },
        date: { type: Sequelize.DATEONLY, primaryKey: true },
        age: { type: Sequelize.INTEGER, primaryKey: true },
        vaccine_amount: { type: Sequelize.INTEGER },
      },
      {
        freezeTableName: true,
      }
    );

    this.PendingReservations = this.sequelize.define(
      "pending_reservations",
      {
        state_code: { type: Sequelize.INTEGER, primaryKey: true },
        pending_amount: { type: Sequelize.INTEGER },
        zone_code: { type: Sequelize.INTEGER, primaryKey: true },
      },
      {
        freezeTableName: true,
      }
    );

    await this.VaccinesByStateAndTurn.sync({ force: false });
    await this.VaccinesByStateAndZone.sync({ force: false });
    await this.PendingReservations.sync({ force: false });
    await this.connectDB();
    // this.createTestData();
  }

  async initialize() {
    // create db if it doesn't already exist
    const { queryDatabase } = config;
    this.connection = new Client({
      user: "postgres",
      host: "localhost",
      password: "password",
      port: 5432,
    });
    await this.connection.connect();
    this.connection.query("SELECT datname FROM pg_database;", (err, res) => {
      if (err) {
        console.log("Error conectando a la base de datos queryDB")
      }
      else {
        if (res.rows.filter((d) => d.datname === queryDatabase).length < 1) {
          this.connection.query(`CREATE DATABASE ${queryDatabase};`, async (error, response) => {
            if(error){
              console.log("Error creando la base de datos queryDB")
            }
            else{
            console.log("Creando base de datos queryDB");
            this.createTables();
            }
          });
        } else {
          console.log("Creando base de datos queryDB");
          this.createTables();
        }
      }
    });
  }

  async connectDB() {
    const { queryDatabase } = config;
    await this.connection.end();
    this.connection = new Client({
      user: "postgres",
      host: "localhost",
      password: "password",
      database: queryDatabase,
      port: 5432,
    });
    await this.connection.connect();
  }

  async createTestData() {
    await this.PendingReservations.create({
      state_code: 1,
      pending_amount: 20,
      zone_code: 1,
    });

    await this.PendingReservations.create({
      state_code: 1,
      pending_amount: 20,
      zone_code: 2,
    });

    await this.PendingReservations.create({
      state_code: 1,
      pending_amount: 20,
      zone_code: 3,
    });

    await this.PendingReservations.create({
      state_code: 2,
      pending_amount: 20,
      zone_code: 1,
    });

    await this.PendingReservations.create({
      state_code: 2,
      pending_amount: 20,
      zone_code: 2,
    });

    await this.PendingReservations.create({
      state_code: 3,
      pending_amount: 20,
      zone_code: 4,
    });

    await this.PendingReservations.create({
      state_code: 3,
      pending_amount: 20,
      zone_code: 5,
    });
  }
};
