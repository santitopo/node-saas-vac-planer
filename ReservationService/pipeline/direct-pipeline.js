const AbstractPipeline = require("./abstract-pipeline");

class DirectPipeline extends AbstractPipeline {
  run(input) {
    let pendingFilters = this.filters.slice();
    // Iterate over filters array
    let loop = (err, result) => {
      if (err) {
        // Emit an event and stop execution if an error occurs
        return { code: 400, message: err };
      }
      if (pendingFilters.length === 0) {
        // Emit an evente and finalize excecution when no more filters left
        return null;
      }
      let filter = pendingFilters.shift();
      return filter.call(this, result, loop);
    };
    const resultado = loop(null, input);
    return resultado;
  }
}

module.exports = DirectPipeline;
