nameFilter = (input, next) => {
  if (input.name) {
    console.log(`the name is ${input.name}`);
    next(null, input);
  } else {
    next("Name not found", null);
  }
};

module.exports = nameFilter;
