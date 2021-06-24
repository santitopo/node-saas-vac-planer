const { Op, Sequelize } = require("sequelize");
const { Client } = require("pg");
const config = require("../../config.json");

module.exports = class QueryDataAccess {
  constructor(logger) {
    this.logger = logger;
    this.initialize();
  }

  async vaccinesByStateAndTurn(params) {
    const initialDate = new Date(params[0]);
    const finalDate = new Date(params[1]);
    try {
      const vaccines = await this.VaccinesByStateAndTurn.findAll({
        where: {
          date: {
            [Op.between]: [initialDate, finalDate],
          },
        },
      });
      return { body: vaccines, status: 200 };
    } catch {
      this.logger.logError(`Error en consulta de vacunas por estado y turno`);
      return { body: "Error en la consulta, intente mas tarde", status: 500 };
    }
  }

  async vaccinesByStateAndZone(params) {
    try {
      const initialDate = params[0];
      const finalDate = params[1];
      const vaccines = await this.VaccinesByStateAndZone.findAll({
        where: {
          date: {
            [Op.between]: [initialDate, finalDate],
          },
        },
      });
      return { body: vaccines, status: 200 };
    } catch {
      this.logger.logError(`Error en consulta de vacunas por estado y zona`);
      return { body: "Error en la consulta, intente mas tarde", status: 500 };
    }
  }

  async pendingReservationsByDepartment() {
    try {
      const pendingReservation = await this.PendingReservations.findAll({
        attributes: [
          "state_code",
          [Sequelize.fn("sum", Sequelize.col("pending_amount")), "total"],
        ],
        group: ["state_code"],
      });
      return { body: pendingReservation, status: 200 };
    } catch {
      this.logger.logError(`Error en consulta de reservas pendientes por estado`);
      return { body: "Error en la consulta, intente mas tarde", status: 500 };
    }
  }

  async pendingReservationsByDepartmentAndZone() {
    try {
      const pendingReservation = await this.PendingReservations.findAll({
        attributes: [
          "state_code",
          "zone_code",
          [Sequelize.fn("sum", Sequelize.col("pending_amount")), "total"],
        ],
        group: ["state_code", "zone_code"],
      });
      return { body: pendingReservation, status: 200 };
    } catch {
      this.logger.logError(`Error en consulta de reservas pendientes por estado y zona`);
      return { body: "Error en la consulta, intente mas tarde", status: 500 };
    }
  }

  async createTables() {
    this.logger.logInfo("Connecting to Database...");
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
        date: { type: Sequelize.DATE, primaryKey: true },
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
        date: { type: Sequelize.DATE, primaryKey: true },
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
        this.logger.logError("Error conectando a la base de datos queryDB")
      }
      else {
        if (res.rows.filter((d) => d.datname === queryDatabase).length < 1) {
          this.connection.query(`CREATE DATABASE ${queryDatabase};`, async (error, response) => {
            if(error){
              this.logger.logError("Error creando la base de datos queryDB")
            }
            else{
              this.logger.logInfo("Creando base de datos queryDB");
            this.createTables();
            }
          });
        } else {
          this.logger.logInfo("Creando base de datos queryDB");
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
};
