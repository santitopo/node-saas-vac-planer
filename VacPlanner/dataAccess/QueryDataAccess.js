const { Op, Sequelize } = require("sequelize");
const { Client } = require("pg");
const config = require("../../config.json");

module.exports = class QueryDataAccess {
  constructor() {
    this.initialize();
  }

  async vaccinesByStateAndTurn(params) {
    const initialDate = params[0];
    const finalDate = params[1];
    const vaccines = await this.VaccinesByStateAndTurn.findAll({
      where: {
        date: {
          [Op.between]: [initialDate, finalDate],
        }
      },
    });
    return vaccines
  }

  async vaccinesByStateAndZone(params) {
    const initialDate = params[0];
    const finalDate = params[1];
    const vaccines = await this.VaccinesByStateAndZone.findAll({
      where: {
        date: {
          [Op.between]: [initialDate, finalDate],
        }
      },
    });
    return vaccines
  }

  async pendingReservaionsByDepartment() {
    const pendingReservation = await this.PendingReservations.findAll({
      atributes: ['state_code', [Sequelize.fn('sum', Sequelize.col('vaccine_amount')), 'total']]
    });
    return pendingReservation
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
        state_code: { type: Sequelize.STRING, primaryKey:true },
        turn: { type: Sequelize.STRING, primaryKey:true },
        date: { type: Sequelize.DATE, primaryKey:true },
        vaccine_amount: { type: Sequelize.INTEGER, primaryKey:true },
      },
      {
        freezeTableName: true,
      }
    );

    this.VaccinesByStateAndZone = this.sequelize.define(
      "vaccines_by_state_and_zone",
      {
        state_code: { type: Sequelize.STRING, primaryKey:true },
        zone_code: { type: Sequelize.STRING, primaryKey:true },
        date: { type: Sequelize.DATE, primaryKey:true },
        age: { type: Sequelize.INTEGER, primaryKey:true },
        vaccine_amount: { type: Sequelize.INTEGER, primaryKey:true },
      },
      {
        freezeTableName: true,
      }
    );

    this.PendingReservations = this.sequelize.define(
      "pending_reservations",
      {
        state_code: { type: Sequelize.STRING, primaryKey:true },
        vaccine_amount: { type: Sequelize.INTEGER, primaryKey:true },
        zone_code: { type: Sequelize.STRING, primaryKey:true },
      },
      {
        freezeTableName: true,
      }
    );

    this.GivenAndRemainingVaccines = this.sequelize.define(
      "given_and_remaining_vaccines",
      {
        vac_center_id: { type: Sequelize.INTEGER, primaryKey:true },
        date: { type: Sequelize.DATE },
        remaining_vaccines: { type: Sequelize.INTEGER, primaryKey:true },
        given_vaccines: { type: Sequelize.INTEGER, primaryKey:true },
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
      state_code: "Code1",
      vaccine_amount: 20,
      zone_code: "Code1",
    });

    await this.PendingReservations.create({
      state_code: "Code1",
      vaccine_amount: 20,
      zone_code: "Code2",
    });

    await this.PendingReservations.create({
      state_code: "Code1",
      vaccine_amount: 20,
      zone_code: "Code3",
    });

    await this.PendingReservations.create({
      state_code: "Code2",
      vaccine_amount: 20,
      zone_code: "Code1",
    });

    await this.PendingReservations.create({
      state_code: "Code2",
      vaccine_amount: 20,
      zone_code: "Code2",
    });

    await this.PendingReservations.create({
      state_code: "Code3",
      vaccine_amount: 20,
      zone_code: "Code4",
    });

    await this.PendingReservations.create({
      state_code: "Code3",
      vaccine_amount: 20,
      zone_code: "Code5",
    });
  }
}