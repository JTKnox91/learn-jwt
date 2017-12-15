module.exports = {
  atob: function (str) {
    return new Buffer(str, 'base64').toString('binary');
  },
  btoa: function (str) {
    return new Buffer(str, 'binary').toString('base64');
  }
}