var mongoose = require('mongoose');
var bcrypt = require('bcrypt');

/**
 * 유저 정보 데이터
 * @typedef {Object} UserInfo
 * @property {string} name
 * @property {string} email
 * @property {string} password
 */

/**
 * users 도뮤멘트의 스키마
 * @type {Mongoose.Schema}
 */
var users = new mongoose.Schema({
    name : {type : String, required : true, unique : true},
    email : {type : String, required : true, unique : true},
    password : {type : String, required : true}
});

users.pre('save', function(next) {
    var self = this;

    if (this.isModified('password')) {
        bcrypt.genSalt(10, function(err, salt) {
            if (err) {
                next(err);
                return;
            }

            bcrypt.hash(self.password, salt, function(err, hash) {
                if (err) {
                    next(err);
                    return;
                }

                self.password = hash;

                next();
            });
        });
    } else {
        next();
    }
});

module.exports = users;
