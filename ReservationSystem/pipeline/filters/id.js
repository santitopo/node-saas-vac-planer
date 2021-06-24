id = (input, next) => {
    if ((input.id) && input.id.match(/^[0-9]+$/) && input.id[input.id.length - 1] == validation_digit(input.id)) {
        return next(null, input);
    } else {
        return next("Se espera un campo id sin puntos ni guiones, verifique estar ingrsando su cedula correctamente", null);
    }
};
module.exports = id;


function validation_digit(ci) {
    var a = 0;
    var i = 0;
    if (ci.length <= 6) {
        for (i = ci.length; i < 7; i++) {
            ci = '0' + ci;
        }
    }
    for (i = 0; i < 7; i++) {
        a += (parseInt("2987634"[i]) * parseInt(ci[i])) % 10;
    }
    if (a % 10 === 0) {
        return 0;
    } else {
        return 10 - a % 10;
    }
}