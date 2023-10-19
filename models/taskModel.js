// models/task.js
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    user_id: {
        type: String,
    },
    name: {
        type: String,

    },
    day: {
        type: String,
    },
    isComplete: {
        type: Boolean
    }
    // name: String,
    // isComplete: Boolean
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task