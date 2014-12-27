var mongoose = require('mongoose');
var schema = require('./schema/users');
var users = mongoose.model('users', schema);

/**
 * 사용자 DAO 객체
 * @type {{create: Function, findBy: Function}}
 */
var usersDAO = {

    /**
     * 사용자를 추가한다.
     * @param {UserInfo|Array.<UserInfo>} userinfo
     * @returns {Mongoose.Promise|Promise}
     */
    create : function(userinfo) {
        return users.create(userinfo).then(function() {
            var result = [];
            var length = arguments.length;

            for (var i = 0, n = length; i < n; i++) {
                result = Array.prototype.slice.apply(arguments);
            }

            return length > 1 ? result : result[0];
        });
    },

    /**
     * 이메일에 해당하는 사용자를 반환한다.
     * @param {Object} query
     * @returns {Mongoose.Promise|Promise}
     */
    findBy : function(query) {
        return users.findOne(query).exec();
    }
};

module.exports = usersDAO;