// models/task.js
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    user_id: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true

    },
    dateTime: {
        type: Date,
    },
    taskTime: {
        type: String,

    },
    isComplete: {
        type: Boolean,
        default: false
    }
    // name: String,
    // isComplete: Boolean
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task