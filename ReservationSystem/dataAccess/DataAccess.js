const config = require("../../config.json");
const { Client } = require("pg");
const { Sequelize } = require("sequelize");

module.exports = class CountryDataAccess {
  constructor(logger) {
    this.logger = logger;
    this.initialize();
  }

  async createTables() {
    await this.connectDB();
    const { host, port, user, password, database } = config;
    // connect to db
    this.sequelize = new Sequelize(
      `postgres://${user}:${password}@${host}:${port}/${database}`,
      { logging: false }
    );

    // init Models and add them with FK and PK restrictions to the db object

    this.Permission = this.sequelize.define(
      "permission",
      {
        name: { type: Sequelize.STRING, unique: true },
      },
      {
        freezeTableName: true,
      }
    );
    this.User = this.sequelize.define(
      "sys_user",
      {
        user_name: { type: Sequelize.STRING, unique: true },
        password: { type: Sequelize.STRING },
      },
      {
        freezeTableName: true,
      }
    );
    this.UserPermission = this.sequelize.define(
      "user_permission",
      {
        permission_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          references: {
            model: "permission",
            key: "id",
          },
        },
        user_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          references: {
            model: "sys_user",
            key: "id",
          },
        },
      },
      {
        freezeTableName: true,
      }
    );

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
        state_code: {
          type: Sequelize.INTEGER,
          references: {
            model: "state",
            key: "code",
          },
        },
        zone_id: {
          type: Sequelize.INTEGER,
          references: {
            model: "zone",
            key: "id",
          },
        },
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
    await this.Permission.sync({ force: false });
    await this.User.sync({ force: false });
    await this.UserPermission.sync({ force: false });
    await this.AssignmentCriteria.sync({ force: false });
    await this.Vaccine.sync({ force: false });
    await this.State.sync({ force: false });
    await this.Zone.sync({ force: false });
    await this.VacCenter.sync({ force: false });
    await this.VaccinationPeriod.sync({ force: false });
    await this.Reservation.sync({ force: false });
    await this.Slot.sync({ force: false });
  }

  async updateSlot(data) {
    const updateQuery = this.bindQuery(data).replace(/\n/g, " ");
    return this.connection
      .query(updateQuery)
      .then((data) => {
        if (data.rows[0]) {
          return JSON.parse(data.rows[0]["concat"]);
        }
        return null;
      })
      .catch(() => {
        this.logger.logError("Error actualizando el cupo");
        throw new Error("Error actualizando el cupo")
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
      if (err) {
        this.logger.logError("Error conectando a la base de datos countryDB")
      }
      else {
        if (res.rows.filter((d) => d.datname === database).length < 1) {
          this.connection.query(`CREATE DATABASE ${database};`, async (error, response) => {
            if(error){
              this.logger.logError("Error creando la base de datos countryDB")
            }
            else{
            this.logger.logInfo("Creando base de datos countryDB");
            this.createTables();
            }
          });
        } else {
          this.logger.logInfo("Creando base de datos countryDB");
          this.createTables();
        }
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
              s.date between '${data.reservationDate} 00:00:01'  AND '${data.reservationDate} 23:59:59' AND
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

  async checkDniInReservations(personId) {
    const reservation = await this.Reservation.findAll({
      where: {
        dni: personId,
      },
    });
    return reservation;
  }
};
