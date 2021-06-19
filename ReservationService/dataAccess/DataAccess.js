const config = require("../../config.json");
const { Client } = require("pg");
const { Sequelize } = require("sequelize");

module.exports = class CountryDataAccess {
  constructor() {
    this.initialize();
  }

  async createTables() {
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
      date_from: new Date("02-02-2021"),
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
      date: new Date("02-02-2021"),
      turn: 1,
      state_code: 1,
      vac_center_id: 1,
      zone_id: 1,
      vaccination_period_id: 1,
    });
  }
  async updateSlot(data) {
    await this.createTestData();
    const updateQuery = this.bindQuery(data).replace(/\n/g, " ");
    return this.connection
      .query(updateQuery)
      .then((data) => {
        if (data.rows[0]) {
          return JSON.parse(data.rows[0]["concat"]);
        }
        return null;
      })
      .catch((err) => {
        console.log("error is", err);
        return null;
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
    this.connection.connect();
    this.connection.query("SELECT datname FROM pg_database;", (err, res) => {
      if (res.rows.filter((d) => d.datname === database).length < 1) {
        this.connection.query(`CREATE DATABASE ${database};`, (err, res) => {
          console.log(err, res);
          this.connection.end();
        });
      }
    });
    this.createTables();
    this.connection = new Client({
      user: "postgres",
      host: "localhost",
      password: "password",
      database: database,
      port: 5432,
    });
    this.connection.connect();
  }

  printAssignmentCriterias(arr) {
    let str = "";
    arr.forEach((e) => (str = str + e + ","));
    str = str.length > 0 ? str.slice(0, str.length - 1) : "-1";
    return str;
  }

  bindQuery(data) {
    return `UPDATE slot s SET available_slots = s.available_slots-1 where
    ROW(s.date,s.turn,s.state_code, s.vac_center_id,s.zone_id,s.vaccination_period_id,s.available_slots) =
    (SELECT date,turn,s.state_code,vac_center_id,zone_id,vaccination_period_id,available_slots FROM 
           slot s, zone z
              WHERE (
              s.date = '${data.reservationDate}' AND
              s.available_slots > 0 AND
              s.zone_id = z.id AND z.code = ${data.zoneCode} AND 
              s.state_code = ${data.stateCode} AND
              s.assignment_criteria_id IN (${this.printAssignmentCriterias(
                data.assignmentCriteriasIds
              )}) ) 
              ORDER BY s.turn ${data.turn === 3 ? "DESC" : "ASC"}
              LIMIT 1)
    RETURNING CONCAT('{"turn" :', s.turn,',"vacCenterCode":', s.vac_center_id, ',"vaccinationPeriodId": ', s.vaccination_period_id,'}');`;
  }
};
