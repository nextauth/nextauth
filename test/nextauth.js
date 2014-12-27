var assert = require('assert');
var express = require('express');
var request = require('supertest');
var Nextauth = require('../src');

/**
 * POST 요청에서 사용할 가짜 파라메터를 설정한다.
 * @param {{useremail:string, password:string}|{}?} params
 * @returns {function}
 */
function setParameter(params) {
    params = params || {
        useremail : 'bob@example.com',
        password : 'secret'
    };

    return function(req, res, next) {
        req.body = params;
        next();
    };
}

describe('Nextauth', function() {
    it('nextauth 객체를 생성할 수 있다.', function() {
        var nextauth = new Nextauth();

        assert.equal(typeof Nextauth, 'function');
        assert.equal(typeof nextauth, 'object');
        assert.equal(typeof nextauth.initialize, 'function');
        assert.equal(typeof nextauth.accountor, 'function');
    });

    it('POST 요청으로 로그인 할 수 있다.', function(done) {
        var nextauth = new Nextauth();
        var isSigned = false;

        var app = express()
        .use(setParameter())
        .use(nextauth.initialize())
        .use(nextauth.accountor())
        .use(function(req, res) {
            isSigned = req.isAuthenticated();
            res.end();
        });

        nextauth.verify(function(email, password, next) {
            next(null, {id : 1, email : email});
        });

        request(app)
        .post('/api/account')
        .expect(200, function() {
            assert.equal(isSigned, true);
            done();
        });
    });

    it('DELETE 요청으로 로그아웃 할 수 있다.', function(done) {
        var nextauth = new Nextauth();
        var isUnsigned = false;

        var app = express()
        .use(function(req, res, next) {
            req.session = {};
            req.session.nextauth = {};
            req.session.nextauth.user = {};

            next();
        })
        .use(nextauth.initialize())
        .use(nextauth.accountor())
        .use(function(req, res) {
            isUnsigned = req.isUnauthenticated();
            res.end();
        });

        request(app)
        .delete('/api/account')
        .expect(200, function() {
            assert.equal(isUnsigned, true);
            done();
        });
    });

    it('파라메터를 생략하지 않아야 로그인을 할 수 있다.', function(done) {
        var nextauth = new Nextauth();

        var app = express()
        .use(setParameter({}))
        .use(nextauth.initialize())
        .use(nextauth.accountor());

        request(app)
        .post('/api/account')
        .expect(401, function(err, res) {
            if (err) {
                done(err);
            }

            assert.equal(res.statusCode, 401);
            assert.equal(res.text, '이메일 혹은 패스워드가 전달되지 않았습니다.');
            done();
        });
    });

    it('올바른 이메일 형식으로 요청해야 로그인할 수 있다.', function(done) {
        var nextauth = new Nextauth();

        var app = express()
        .use(setParameter({
            useremail : 'bob@',
            password : 'secret'
        }))
        .use(nextauth.initialize())
        .use(nextauth.accountor());

        request(app)
        .post('/api/account')
        .expect(401, function(err, res) {
            if (err) {
                done(err);
            }

            assert.equal(res.statusCode, 401);
            assert.equal(res.text, '이메일 형식이 올바르지 않습니다.');
            done();
        });
    });

    it('올바른 패스워드를 요청해야 로그인할 수 있다.', function(done) {
        var nextauth = new Nextauth();

        var app = express()
        .use(setParameter())
        .use(nextauth.initialize())
        .use(nextauth.accountor());

        nextauth.verify(function(email, password, next) {
            next(new Error('비밀번호가 올바르지 않습니다.'));
        });

        request(app)
        .post('/api/account')
        .expect(401, function(err, res) {
            if (err) {
                done(err);
            }

            assert.equal(res.statusCode, 401);
            assert.equal(res.text, '비밀번호가 올바르지 않습니다.');
            done();
        });
    });
});
