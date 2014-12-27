var extend = require('node.extend');

/**
 * @constructor
 */
var Nextauth = function() {
    this._key = 'nextauth';
    this._options = null;
    this._verify = null;
    this._session = null;

    // HTTP extensions.
    require('./request');

    this.options();
};

extend(Nextauth.prototype, /** @lends Nextauth.prototype */ {

    /**
     * @typedef {Object} NextauthField
     * @property {string} email 이메일 필드 명
     * @property {string} password 비밀번호 필드 명
     */

    /**
     * @typedef {Object} NextauthConfig
     * @property {string} uri
     * @property {NextauthField} field
     */

    /**
     * 옵션 값을 셋팅한다.
     * @param {NextauthConfig|undefined?} options
     * @returns {NextauthConfig|undefined}
     */
    options : function(options) {
        if (!options && this._options) {
            return this._options;
        }

        this._options = extend(true, {
            uri : '/api/account',
            field : {
                email : 'useremail',
                password : 'password'
            }
        }, options);
    },

    /**
     * 세션 초기화를 위한 함수를 반환한다.
     * @returns {function}
     */
    initialize : function() {
        var self = this;

        return function(req, res, next) {
            req[self._key] = self;

            if (req.session && req.session[self._key]) {
                self._session = req.session[self._key];
            } else if (req.session) {
                req.session[self._key] = {};
                self._session = req.session[self._key];
            } else {
                self._session = {};
            }

            if (self._session.user) {
                self._deserialize(self._session.user, function(err, user) {
                    if (err) {
                        next(err);
                        return;
                    }

                    req.user = user;
                    next();
                });
            } else {
                next();
            }
        };
    },

    /**
     * 인증에 사용할 함수를 등록한다.
     * @param {function} verify
     */
    verify : function(verify) {
        if (typeof verify === 'function') {
            this._verify = verify;
        }
    },

    /**
     * 직렬화에 사용할 함수를 등록한다.
     * @param {function} serialize
     */
    serialize : function(serialize) {
        if (typeof serialize === 'function') {
            this._serialize = serialize;
        }
    },

    /**
     * 역직렬화에 사용할 함수를 등록한다.
     * @param {function} deserialize
     */
    deserialize : function(deserialize) {
        if (typeof deserialize === 'function') {
            this._deserialize = deserialize;
        }
    },

    /**
     * 로그인 및 로그아웃을 위한 함수를 반환한다.
     * @returns {function}
     */
    accountor : function() {
        var self = this;

        return function(req, res, next) {
            var uri = self._options.uri;
            var isPost = req.method === 'POST';
            var isDelete = req.method === 'DELETE';

            if (!isPost && !isDelete) {
                next();
                return;
            }

            if (uri !== req.path) {
                next();
                return;
            }

            if (isPost && req.isUnauthenticated()) {
                self._signin(req, res, next);
            } else if (isDelete && req.isAuthenticated()) {
                self._signout(req, res, next);
            } else {
                next();
            }
        };
    },

    /**
     * 로그인 처리를 한다.
     * @param {IncomingMessage|Express.Request} req
     * @param {ServerResponse|Express.Response} res
     * @param {function} done
     * @private
     */
    _signin : function(req, res, done) {
        var field = this._options.field;
        var email = req.body[field.email];
        var password = req.body[field.password];
        var self = this;

        if (!email || !password) {
            res.statusCode = 401;
            res.end('이메일 혹은 패스워드가 전달되지 않았습니다.');
            return;
        }

        if (!/[\w|.|-]*@\w*\.[\w|.]*/g.test(email)) {
            res.statusCode = 401;
            res.end('이메일 형식이 올바르지 않습니다.');
            return;
        }

        process.nextTick(function() {
            self._verify(email, password, function(error, user) {
                if (error) {
                    res.statusCode = 401;
                    res.end(error.message);
                    return;
                }

                if (user) {
                    self._serialize(user, function(err, key) {
                        if (err) {
                            done(err);
                            return;
                        }

                        self._session.user = key;

                        self._deserialize(key, function(err, user) {
                            if (err) {
                                done(err);
                                return;
                            }

                            req.user = user;
                            done();
                        });
                    });
                }
            });
        });
    },

    /**
     * 로그아웃 처리를 한다.
     * @param {IncomingMessage|Express.Request} req
     * @param {ServerResponse|Express.Response} res
     * @param {function} done
     * @private
     */
    _signout : function(req, res, done) {
        delete this._session.user;
        delete req.user;

        done();
    },

    /**
     * 객체를 직렬화한다.
     * @param {*} user
     * @param {function} done
     * @private
     */
    _serialize : function(user, done) {
        done(null, user);
    },

    /**
     * 직렬화된 데이터를 역직렬화한다.
     * @param {*} key
     * @param {function} done
     * @private
     */
    _deserialize : function(key, done) {
        done(null, key);
    }
});

module.exports = Nextauth;
