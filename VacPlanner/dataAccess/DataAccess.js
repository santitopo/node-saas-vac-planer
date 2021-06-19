const config = require("../../config.json");
//const mysql = require("mysql2/promise");
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

    // init Assignment criteria model and add them to the db object
    this.AssignmentCriteria = this.sequelize.define(
      "assignment_criteria",
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
    return this.AssignmentCriteria.create({
      function: JSON.stringify(fun),
    })
      .then((data) => data.getDataValue("id"))
      .catch((e) => null);
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
  }
};
