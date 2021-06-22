const crypto = require("crypto");
const config = require("../../config.json");

module.exports = class UserController {
  constructor(countryDataAcces) {
    this.countryDataAcces = countryDataAcces;
  }

  getPermissionsByRole(role) {
    const { rolesPermissions } = config;
    const permissions = rolesPermissions[role];
    return permissions;
  }

  async addUser(body) {
    try {
      if (!body.userName || !body.password) {
        throw "Datos incorrectos";
      }
      const hash = crypto
        .createHash("md5")
        .update(body.password || "")
        .digest("hex");
      const userId = await this.countryDataAcces.addUser({
        user_name: body.userName,
        password: hash,
      });
      if (!userId) {
        throw "El usuario ya existe";
      }
      const permissions = this.getPermissionsByRole(body.role);
      if (!permissions) {
        console.log("Error: Rol no encontrado");
        throw "Rol no encontrado";
      }
      const err = await this.countryDataAcces.addUserPermissions(
        userId,
        permissions
      );
      if (err) {
        throw err;
      }
      return {
        body: "Usuario Agregado Correctamente",
        status: 200,
      };
    } catch (e) {
      return {
        body: "Error agregando el usuario: " + e,
        status: 400,
      };
    }
  }

  deleteAUser(body) {}
};
