var nextauth = new (require('../../../src'))();
var bcrypt = require('bcrypt');
var usersDAO = require('../model/usersDAO');

// 객체에서 필요한 부분만 직렬화한다.
// 이 값은 세션에 저장된다.
nextauth.serialize(function(user, done) {
    done(null, user.id);
});

// 세션에 저장되어 있는 직렬화된 값으로
// 객체를 생성한다. 이 객체는 req.user로 셋팅된다.
nextauth.deserialize(function(id, done) {
    usersDAO.findBy({_id : id}).then(function(user) {
        done(null, user);
    }).then(null, function(err) {
        done(err);
    });
});

// 로그인 요청시 호출된다. 파라메터의 값과
// 특정 값을 비교하여 로그인을 허용해도 되는지 판단한다.
nextauth.verify(function(email, password, next) {
    usersDAO.findBy({email : email}).then(function(user) {
        if (user) {
            bcrypt.compare(password, user.password, function(err, isMatch) {
                if (err) {
                    next(err);
                    return;
                }

                if (isMatch) {
                    next(null, user);
                } else {
                    next(new Error('비밀번호가 다릅니다.'));
                }
            });
        } else {
            next(new Error('회원정보를 찾지 못했습니다.'));
        }
    }).then(null, function(err) {
        next(err);
    });
});

var myauth = {
    /**
     * 세션 초기화를 위한 함수를 반환한다.
     * @returns {function}
     */
    initialize : function() {
        return nextauth.initialize();
    },

    /**
     * 로그인 및 로그아웃을 위한 함수를 반환한다.
     * @returns {function}
     */
    accountor : function() {
        return nextauth.accountor();
    }
};

module.exports = myauth;
