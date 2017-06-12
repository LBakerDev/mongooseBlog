const mongoose = require('mongoose');

//schema to represent seedData
const seedDataSchema = mongoose.Schema({
    
    author: {
        firstName: String,
        lastName: String
    },
    title: {type: String, required: true},
    content: {type: String, required: true},
    created: {type: Date, default: Date.now}
});

seedDataSchema.virtual('authorName').get(function() {
    return `${this.author.firstName} ${this.author.lastName}`.trim()
});

seedDataSchema.methods.apiRepr = function() {
    return {
        id:this._id,
        author: this.authorName,
        content: this.content,
        title: this.title,
        created: this.created
    };
}

const seedData = mongoose.model('seedData', seedDataSchema);

module.exports = {seedData};
