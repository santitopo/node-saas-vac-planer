const config = require("../config.json");
const mysql = require("mysql2/promise");
const { Sequelize } = require("sequelize");

module.exports = class CountryDataAccess {
  constructor() {
    this.initialize();
    const { host, port, user, password, database } = config;
  }

  async createTables() {
    const { host, port, user, password, database } = config;
    // connect to db
    const sequelize = new Sequelize(database, user, password, {
      dialect: "mysql",
      host: host,
      port: port,
    });

    // init Assignment criteria model and add them to the db object
    this.AssignmentCriteria = sequelize.define(
      "AssignmentCriteria",
      {
        function: { type: Sequelize.STRING },
      },
      {
        freezeTableName: true,
      }
    );

    // sync all models with database
    await this.AssignmentCriteria.sync({ force: false });
  }

  addCriteria(fun) {
    this.AssignmentCriteria.create({
      function: JSON.stringify(fun),
    });
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
