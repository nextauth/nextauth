var http = require('http'),
    req = http.IncomingMessage.prototype;

/**
 * 로그인 상태인지 판단한다.
 * @returns {boolean}
 */
req.isAuthenticated = function() {
    return this.user ? true : false;
};

/**
 * 로그아웃 상태인지 판단한다.
 * @returns {boolean}
 */
req.isUnauthenticated = function() {
    return !this.isAuthenticated();
};
