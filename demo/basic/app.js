var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var nextauth = new (require('../../src'))();
var app = express();
var port = process.env.PORT || 3000;

var users = [
    {id : 1, name : 'bob', email : 'bob@example.com', password : 'secret'},
    {id : 2, name : 'john', email : 'john@example.com', password : 'secret'}
];

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended : false}));
app.use(bodyParser.json());
app.use(session({
    secret : 'secret',
    resave : false,
    saveUninitialized : true
}));
app.use(nextauth.initialize());
app.use(nextauth.accountor());

nextauth.serialize(function(user, done) {
    done(null, user.id);
});

nextauth.deserialize(function(id, done) {
    done(null, users[id - 1]);
});

nextauth.verify(function(email, password, next) {
    var target = users.filter(function(user) {
        return user.email === email;
    })[0];

    if (!target) {
        next(new Error('회원정보를 찾지 못했습니다.'));
        return;
    }

    if (target.password !== password) {
        next(new Error('비밀번호가 다릅니다.'));
        return;
    }

    next(null, target);
});

app.post('/api/account', function(req, res) {
    res.end('success');
});

app.delete('/api/account', function(req, res) {
    res.end('success');
});

app.get('/', function(req, res) {
    if (req.isAuthenticated()) {
        res.render('index', {user : req.user});
    } else {
        res.redirect('/account');
    }
});

app.get('/account', function(req, res) {
    if (req.isUnauthenticated()) {
        res.render('account');
    } else {
        res.redirect('/');
    }
});

app.listen(port, function() {
    console.log('Express server listening on port ' + port);
});
