lastName = (input, next) => {
  if (input.lastname) {
    console.log(`the lastname is ${input.lastname}`);
    next(null, input);
  } else {
    next("LastName not found", null);
  }
};

module.exports = lastName;
