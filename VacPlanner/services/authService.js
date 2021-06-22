const fs = require("fs");
const jwt = require("jsonwebtoken");
const config = require("../../config.json");
const { tokenLife } = config;
const secretKey = fs.readFileSync("services/config/private.key", "utf8");
const publicKey = fs.readFileSync("services/config/public.key", "utf8");

const signOptions = {
  expiresIn: tokenLife,
  algorithm: "RS256",
};

module.exports = class AuthService {
  generateToken(permissions) {
    const token = jwt.sign(
      { permissions: permissions.join(",") },
      secretKey,
      signOptions
    );
    return token;
  }
  async validatePermission(neededPermissions, token) {
    return new Promise((resolve, reject) => {
      let permissions = [];
      let hasPermission = true;
      jwt.verify(token, publicKey, function (err, decoded) {
        if (err) {
          reject(false);
        }
        permissions = decoded.permissions.split(",");

        neededPermissions.forEach((np) => {
          hasPermission = hasPermission && permissions.includes(np);
        });
        resolve(hasPermission);
      });
    });
  }
};
