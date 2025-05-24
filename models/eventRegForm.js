const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const eventRegFormSchema = new Schema({
    name :{
        type : String,
        require: true
    },
    eventName : {
        type: String,
        require: true
    },
    email :{
        type : String,
        require: true
    },
    phone :{
        type : Number,
        require: true
    },
    age :{
        type : Number,
    },
})

const eventRegForm = mongoose.model("eventRegForm",eventRegFormSchema);

module.exports = eventRegForm;