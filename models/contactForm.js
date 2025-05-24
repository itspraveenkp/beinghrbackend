const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const contactFormSchema = new Schema({
    name :{
        type : String,
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
    message :{
        type : String,
        require: true
    },
})

const contactForm = mongoose.model("contactForm",contactFormSchema);

module.exports = contactForm;