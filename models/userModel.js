// models/user.js
const mongoose = require('mongoose');
// const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new mongoose.Schema({
    firstname: {
        type: String,
    },
    lastname: {
        type: String,
    },
    fullname: {
        type: String,
    },
    email: {
        type: String,
        unique: true
    },
    password: {
        type: String
    }
});


const User = mongoose.model('User', userSchema);

module.exports = User