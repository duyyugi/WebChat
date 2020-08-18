const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    senderID: {
        type: mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    receiverID: {
        type: mongoose.Schema.Types.ObjectId,
    },
    content: {
        type: String
    },
    time: {
        type: String
    }
});


module.exports = mongoose.model("Message", messageSchema);
