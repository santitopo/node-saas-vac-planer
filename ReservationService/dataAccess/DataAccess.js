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

  async updateSlot(data) {
    //This method is supposed to make a big update query that finds the wanted slot
    const updateQuery = this.bindQuery(data).replace(/\n/g, " ");
    console.log(updateQuery);
    this.connection
      .query(updateQuery, {
        replacements: {
          reservationDate: data.reservationDate,
          zoneCode: data.zoneCode,
          stateCode: data.stateCode,
          assignmentCriteriasIds: data.assignmentCriteriasIds,
        },
      })
      .then((data) => console.log("data is", data))
      .catch((err) => console.log("error is", err));
    return {};
    // await this.Vaccine.create({
    //   name: "Phizer",
    // });
    // await await this.State.create({
    //   name: "Montevideo",
    //   code: 1,
    // });
    // await this.Zone.create({
    //   code: 1,
    //   name: "Centro",
    //   stateCode: 1,
    // });
    // await this.VacCenter.create({
    //   name: "Española",
    //   zoneId: 1,
    // });
    // await this.AssignmentCriteria.create({
    //   function:
    //     "new Date().getFullYear() - new Date(person.DateOfBirth).getFullYear() > 90",
    // });
    // await this.VaccinationPeriod.create({
    //   vaccineAmount: 300,
    //   dateFrom: new Date("02-02-2021"),
    //   dateTo: new Date("03-03-2021"),
    //   vacCenterId: 1,
    //   assignmentCriteriaId: 1,
    //   vaccineId: 1,
    // });
    // await this.Slot.create({
    //   assignmentCriteriaId: 1,
    //   availableSlots: 50,
    //   totalSlots: 50,
    //   zoneName: "Centro",
    //   stateName: "Montevideo",
    //   date: new Date("02-02-2021"),
    //   turn: 1,
    //   stateCode: 1,
    //   vacCenterId: 1,
    //   zoneId: 1,
    //   vaccinationPeriodId: 1,
    // });
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

  bindQuery(data) {
    return `UPDATE SLOT sl, (SELECT date,turn,s.stateCode,vacCenterId,zoneId,vaccinationPeriodId,availableSlots FROM 
      SLOT s, ZONE z
      WHERE (
      s.date = :reservationDate AND
      s.availableSlots > 0 AND
      s.zoneId = z.id AND z.code = :zoneCode AND 
      s.stateCode = :stateCode AND
      s.assignmentCriteriaId IN :assignmentCriteriasIds ) 
      ORDER BY s.turn ${data.turn === 3 ? "DESC" : "ASC"}
      LIMIT 1) f 
    SET sl.availableSlots = f.availableSlots-1
    WHERE (
    sl.date = f.date AND
    sl.turn = f.turn AND
    sl.stateCode = f.stateCode AND
    sl.vacCenterId = f.vacCenterId AND
    sl.zoneId = f.zoneId AND
    sl.vaccinationPeriodId = f.vaccinationPeriodId)`;
  }
};
