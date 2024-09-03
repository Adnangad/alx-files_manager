const Bull = require('bull');
const fileQueue = new Bull('fileQueue');
module.exports = fileQueue;