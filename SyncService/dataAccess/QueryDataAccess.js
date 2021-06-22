const { Op, Sequelize } = require("sequelize");
const { Client } = require("pg");
const config = require("../../config.json");

module.exports = class QueryDataAccess {
  constructor() {
    this.initialize();
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
        state_code: { type: Sequelize.STRING, primaryKey: true },
        turn: { type: Sequelize.STRING, primaryKey: true },
        date: { type: Sequelize.DATE, primaryKey: true },
        vaccine_amount: { type: Sequelize.INTEGER, primaryKey: true },
      },
      {
        freezeTableName: true,
      }
    );

    this.VaccinesByStateAndZone = this.sequelize.define(
      "vaccines_by_state_and_zone",
      {
        state_code: { type: Sequelize.STRING, primaryKey: true },
        zone_code: { type: Sequelize.STRING, primaryKey: true },
        date: { type: Sequelize.DATE, primaryKey: true },
        age: { type: Sequelize.INTEGER, primaryKey: true },
        vaccine_amount: { type: Sequelize.INTEGER, primaryKey: true },
      },
      {
        freezeTableName: true,
      }
    );

    this.PendingReservations = this.sequelize.define(
      "pending_reservations",
      {
        state_code: { type: Sequelize.INTEGER, primaryKey: true },
        pending_amount: { type: Sequelize.INTEGER, primaryKey: true },
        zone_code: { type: Sequelize.INTEGER, primaryKey: true },
      },
      {
        freezeTableName: true,
      }
    );

    this.GivenAndRemainingVaccines = this.sequelize.define(
      "given_and_remaining_vaccines",
      {
        vac_center_id: { type: Sequelize.INTEGER, primaryKey: true },
        date: { type: Sequelize.DATE },
        remaining_vaccines: { type: Sequelize.INTEGER, primaryKey: true },
        given_vaccines: { type: Sequelize.INTEGER, primaryKey: true },
      },
      {
        freezeTableName: true,
      }
    );

    await this.VaccinesByStateAndTurn.sync({ force: false });
    await this.VaccinesByStateAndZone.sync({ force: false });
    await this.PendingReservations.sync({ force: false });
    await this.GivenAndRemainingVaccines.sync({ force: false });
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
      if (res.rows.filter((d) => d.datname === queryDatabase).length < 1) {
        console.log("Creating Database...");
        this.connection.query(`CREATE DATABASE ${queryDatabase};`, async () => {
          this.createTables();
        });
      } else {
        this.createTables();
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
