const config = require("../../config.json");
//const mysql = require("mysql2/promise");
const { Client } = require("pg");
const { Sequelize, Op } = require("sequelize");
const crypto = require("crypto");
const redis = require("redis");


const permissionsQuery = `
select p.name from sys_user u, user_permission up, permission p
where u.user_name= $1::text
AND up.user_id = u.id
AND up.permission_id = p.id`;
module.exports = class CountryDataAccess {
  constructor() {
    this.initialize();
    this.client = redis.createClient();
  }

  async createTables() {
    console.log("Connecting to Database...");
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
        date: { type: Sequelize.DATEONLY },
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
        date_from: { type: Sequelize.DATEONLY },
        date_to: { type: Sequelize.DATEONLY },
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
        date: { type: Sequelize.DATEONLY, primaryKey: true },
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
  async createTestData() {
    const hash = crypto.createHash("md5").update("pass").digest("hex");
    await this.Permission.create({
      name: "vac_center_crud",
    });
    await this.Permission.create({
      name: "vaccine_crud",
    });
    await this.Permission.create({
      name: "vac_period_crud",
    });
    await this.Permission.create({
      name: "state_crud",
    });
    await this.Permission.create({
      name: "zone_crud",
    });
    await this.Permission.create({
      name: "assignment_criteria_add",
    });
    await this.Permission.create({
      name: "validation_add",
    });
    await this.Permission.create({
      name: "create_users",
    });
    await this.Permission.create({
      name: "give_vaccine",
    });
    await this.Permission.create({
      name: "query",
    });
    await this.Permission.create({
      name: "api_crud",
    });
    await this.User.create({
      user_name: "santitopo",
      password: hash,
    });
    await this.User.create({
      user_name: "colominetti",
      password: hash,
    });
    await this.UserPermission.create({
      user_id: 1,
      permission_id: 1,
    });
    await this.UserPermission.create({
      user_id: 1,
      permission_id: 2,
    });
    await this.UserPermission.create({
      user_id: 1,
      permission_id: 3,
    });
    await this.UserPermission.create({
      user_id: 1,
      permission_id: 4,
    });
    await this.UserPermission.create({
      user_id: 1,
      permission_id: 5,
    });
    await this.UserPermission.create({
      user_id: 1,
      permission_id: 6,
    });
    await this.UserPermission.create({
      user_id: 1,
      permission_id: 7,
    });
    await this.UserPermission.create({
      user_id: 1,
      permission_id: 8,
    });
    await this.UserPermission.create({
      user_id: 1,
      permission_id: 9,
    });
    await this.UserPermission.create({
      user_id: 1,
      permission_id: 10,
    });
    await this.UserPermission.create({
      user_id: 1,
      permission_id: 11,
    });
    await this.UserPermission.create({
      user_id: 2,
      permission_id: 1,
    });
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
      state_code: 1,
      zone_id: 1,
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

  //POST
  async addUserPermission(userId, permissionId) {
    return this.UserPermission.create({
      permission_id: permissionId,
      user_id: userId,
    });
  }

  async addUserPermissions(userId, permissions) {
    try {
      const permissionModels = await this.Permission.findAll({
        where: {
          name: { [Op.in]: permissions },
        },
      });
      const aux = JSON.parse(JSON.stringify(permissionModels));
      aux.forEach(async (fp) => {
        console.log("inside foreach");
        await this.addUserPermission(userId, fp.id);
      });
      return null;
    } catch (e) {
      return "Error Agregando Permisos";
    }
  }

  async addUser(user) {
    return this.User.create(user)
      .then((data) => data.getDataValue("id"))
      .catch((e) => null);
  }

  async login(user, password) {
    try {
      const foundUser = await this.User.findOne({ where: { user_name: user } });
      if (!foundUser) {
        return Promise.reject("No se encontró el usuario");
      }
      if (foundUser instanceof this.User) {
        const hash = crypto
          .createHash("md5")
          .update(password || "")
          .digest("hex");
        if (!password || hash !== foundUser.password) {
          return Promise.reject("Credenciales Incorrectas");
        }
        const permissions = await this.connection.query(
          permissionsQuery.replace(/\n/g, " "),
          [user]
        );
        return permissions.rows.map((p) => p.name);
      }
    } catch {
      console.log(`Error en login para usuario ${user}`);
      return Promise.reject("Error del servidor");
    }
  }

  addCriteria(fun) {
    return this.AssignmentCriteria.create({
      function: JSON.stringify(fun),
    })
      .then((data) => data.getDataValue("id"))
      .catch((e) => {
        console.log("Error agregando criterio a base de datos")
        return null
      });
  }

  async addState(state) {
    return await this.State.create({
      code: state.code,
      name: state.name,
    });
  }
  async addZone(zone) {
    return await this.Zone.create({
      code: zone.code,
      state_code: zone.state_code,
      name: zone.name,
    });
  }
  async addVacCenter(vacCenter) {
    return await this.VacCenter.create({
      zone_id: vacCenter.zone_id,
      name: vacCenter.name,
    });
  }
  async addVaccine(vaccine) {
    return await this.Vaccine.create({
      name: vaccine.name,
      recommendations: vaccine.recommendations,
    });
  }
  async addVaccinationPeriod(vaccinationPeriod) {
    let vp = await this.VaccinationPeriod.create({
      vaccine_amount: vaccinationPeriod.vaccine_amount,
      date_from: vaccinationPeriod.date_from,
      date_to: vaccinationPeriod.date_to,
      vac_center_id: vaccinationPeriod.vac_center_id,
      assignment_criteria_id: vaccinationPeriod.assignment_criteria_id,
      vaccine_id: vaccinationPeriod.vaccine_id,
    });
    return JSON.stringify(vp, null, 2);
  }
  async addSlot(slot) {
    return await this.Slot.create({
      assignment_criteria_id: slot.assignment_criteria_id,
      available_slots: slot.available_slots,
      total_slots: slot.total_slots,
      date: slot.date,
      turn: slot.turn,
      state_code: slot.state_code,
      vac_center_id: slot.vac_center_id,
      zone_id: slot.zone_id,
      vaccination_period_id: slot.vaccination_period_id,
    });
  }
  async addReservation(reservation) {
    if (reservation.vaccinationPeriodId) {
      return await this.Reservation.create({
        dni: reservation.dni,
        phone: reservation.phone,
        reservation_code: reservation.reservationCode,
        date: reservation.date,
        assigned: reservation.assigned,
        turn: reservation.turn,
        state_code: reservation.state_code,
        zone_id: reservation.zone_id,
        vaccination_period_id: reservation.vaccinationPeriodId,
      });
    } else {
      return await this.Reservation.create({
        dni: reservation.dni,
        phone: reservation.phone,
        reservation_code: reservation.reservationCode,
        date: reservation.date,
        assigned: reservation.assigned,
        turn: reservation.turn,
        state_code: reservation.state_code,
        zone_id: reservation.zone_id,
      });
    }
  }

  //GET ALL
  async getStates() {
    const states = await this.State.findAll();
    return JSON.stringify(states, null, 2);
  }
  async getZones() {
    const zones = await this.Zone.findAll();
    return JSON.stringify(zones, null, 2);
  }
  async getVacCenters() {
    const vacCenters = await this.VacCenter.findAll();
    return JSON.stringify(vacCenters, null, 2);
  }
  async getVaccines() {
    const vaccines = await this.Vaccine.findAll();
    return JSON.stringify(vaccines, null, 2);
  }
  async getVaccinationPeriods() {
    const vaccinationPeriods = await this.VaccinationPeriod.findAll();
    return JSON.stringify(vaccinationPeriods, null, 2);
  }
  async getSlots() {
    const slots = await this.Slot.findAll();
    return JSON.stringify(slots, null, 2);
  }
  async getReservations(zone_id, state_code, date1, date2, turn, today) {
    let reservations;
    reservations = await this.connection
      .query(
        `select * from reservation where assigned = false and state_code = ${state_code} and zone_id = ${zone_id} and ((date between '${date1}' and '${date2}')  or (date <= '${today}'))`
      )
      .then((data) => data)
      .catch((e) => console.log(e));
    return reservations;
  }

  //GET
  async getAState(code) {
    const states = await this.State.findAll({
      where: {
        code: code,
      },
    });
    return JSON.stringify(states, null, 2);
  }
  async getAZone(id) {
    const zones = await this.Zone.findAll({
      where: {
        id: id,
      },
    });
    return zones;
  }
  async getAVacCenter(id) {
    const vacCenter = await this.VacCenter.findOne({
      where: {
        id: id,
      },
    });
    return vacCenter;
  }
  async getAVaccine(id) {
    const vaccines = await this.Vaccine.findAll({
      where: {
        id: id,
      },
    });
    return JSON.stringify(vaccines, null, 2);
  }
  async getAVaccinationPeriod(id) {
    const vaccinationPeriods = await this.VaccinationPeriod.findAll({
      where: {
        id: id,
      },
    });
    let json = JSON.stringify(vaccinationPeriods, null, 2);
    return json;
  }
  async getASlot(body) {
    const slots = await this.Slot.findAll({
      where: {
        date: body.date,
        turn: body.turn,
        vaccination_period_id: body.vaccination_period_id,
      },
    });
    return JSON.stringify(slots, null, 2);
  }
  async getACriteria(id) {
    const criteria = await this.AssignmentCriteria.findAll({
      where: {
        id: id,
      },
    });
    return JSON.stringify(criteria, null, 2);
  }
  async getAReservation(dni) {
    const reservation = await this.Reservation.findOne({
      where: {
        dni: dni,
      },
    });
    return reservation;
  }

  //DELETE
  async deleteAState(code) {
    return await this.State.destroy({
      where: {
        code: code,
      },
    });
  }
  async deleteAZone(id) {
    return await this.Zone.destroy({
      where: {
        id: id,
      },
    });
  }
  async deleteAVacCenter(id) {
    return await this.VacCenter.destroy({
      where: {
        id: id,
      },
    });
  }
  async deleteAVaccine(id) {
    return await this.Vaccine.destroy({
      where: {
        id: id,
      },
    });
  }
  async deleteAVaccinationPeriod(id) {
    return await this.VaccinationPeriod.destroy({
      where: {
        id: id,
      },
    });
  }
  async deleteASlot(body) {
    return await this.Slot.destroy({
      where: {
        date: body.date,
        turn: body.turn,
        vaccination_period_id: body.vaccination_period_id,
      },
    });
  }

  //UPDATE
  async updateAState(code, newName) {
    return await this.State.update(newName, {
      where: {
        code: code,
      },
    });
  }
  async updateAZone(id, newName) {
    return await this.Zone.update(newName, {
      where: {
        id: id,
      },
    });
  }
  async updateAVacCenter(id, newName) {
    return await this.VacCenter.update(newName, {
      where: {
        id: id,
      },
    });
  }
  async updateAVaccine(id, newName) {
    return await this.Vaccine.update(newName, {
      where: {
        id: id,
      },
    });
  }
  async updateAVaccinationPeriod(id, newName) {
    let ret = await this.VaccinationPeriod.update(newName, {
      where: {
        id: id,
      },
    });
    return ret;
  }
  async updateASlot(newName) {
    let update = {
      available_slots: newName.available_slots,
      total_slots: newName.total_slots,
    };
    return await this.Slot.update(update, {
      where: {
        date: newName.date,
        turn: newName.turn,
        vaccination_period_id: newName.vaccination_period_id,
      },
    });
  }
  async updateAReservation(reservation) {
    let ret = await this.Reservation.update(reservation, {
      where: {
        reservation_code: reservation.reservation_code,
      },
    });
    return ret;
  }

  async checkDniInReservations(personId) {
    const reservation = await this.Reservation.findAll({
      where: {
        dni: personId,
      },
    });
    return reservation;
  }

  async deleteReservation(personId, reservationCode) {
    const reservation = await this.Reservation.destroy({
      where: {
        dni: personId,
        reservation_code: reservationCode,
      },
    });
    return reservation;
  }

  //DNI
  async addDniCenter(body) {
    this.client.set("DniCenter", body.url, redis.print);
  }
  //SMS
  async addSMSService(body) {
    if (body.id && body.url) {
      let sms = {
        id: body.id,
        url: body.url
      }
      let arr = (await this.client.getAsync("SMSService") || "[]")
      arr = JSON.parse(arr)
      if (arr) {
        let aux = arr.filter(item => item.id == body.id)
        if (aux.length > 0) {
          return "No se pudo agregar esta url, ya existe una url con esa id"
        }
      }
      arr.push(sms)
      arr = JSON.stringify(arr)
      await this.client.setAsync("SMSService", arr)
      return "Agregado satisfactoriamente"
    } else {
      return "No se pudo agregar esta url, recuerde debe enviar los campos id y url"
    }
  }
  async deleteSMSService(body) {
    if (body.id) {
      let arr = (await this.client.getAsync("SMSService") || "[]")
      arr = JSON.parse(arr)
      if (arr) {
        let aux = arr.filter(item => item.id == body.id)
        if (aux.length == 0) {
          return "No existe un objeto con el id provisto"
        }
        arr = arr.filter(item => item.id != body.id)
      }
      arr = JSON.stringify(arr)
      await this.client.setAsync("SMSService", arr)
      return "Borrado satisfactoriamente"
    } else {
      return "No se pudo agregar esta url, recuerde debe enviar los campos id y url"
    }
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
        console.log("Error conectando a la base de datos countryDB")
      }
      else {
        if (res.rows.filter((d) => d.datname === database).length < 1) {
          this.connection.query(`CREATE DATABASE ${database};`, async (error, response) => {
            if(error){
              console.log("Error creando la base de datos countryDB")
            }
            else{
            console.log("Creando base de datos countryDB");
            this.createTables();
            }
          });
        } else {
          console.log("Creando base de datos countryDB");
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
};
