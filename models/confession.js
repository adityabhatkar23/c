
const mongoose = require('mongoose');

const confessionSchema = new mongoose.Schema({
    confessionText: String,
    accepted: { type: Boolean, default: false },
    dateSubmitted: { type: Date, default: Date.now },
    to:String
});

module.exports = mongoose.model('Confession', confessionSchema);
