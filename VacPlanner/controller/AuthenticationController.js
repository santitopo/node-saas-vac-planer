const AuthService = require("../services/authService");

module.exports = class AuthenticationController {
  constructor(countryDataAccess) {
    this.countryDataAccess = countryDataAccess;
    this.authService = new AuthService();
  }

  async login(body) {
    try {
      const permissions = await this.countryDataAccess.login(
        body.user,
        body.password
      );
      const token = this.authService.generateToken(permissions);
      return {
        body: { token },
        status: 200,
      };
    } catch (error) {
      return {
        body: error,
        status: 400,
      };
    }
  }

  async checkPermissions(token, permissions) {
    try {
      const valid = await this.authService.validatePermission(
        permissions,
        token
      );
      return valid;
    } catch (e) {
      return false;
    }
  }

  init() {}
};
