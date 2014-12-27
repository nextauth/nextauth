var express = require('express');
var session = require('express-session');
var mongoose = require('mongoose');
var myauth = require('./service/myauth');
var bodyParser = require('body-parser');
var usersDAO = require('./model/usersDAO');
var mongoStore = new (require('connect-mongo')(session))({db : 'nextauth'});
var app = express();
var port = process.env.PORT || 3000;

mongoose.connect('mongodb://localhost/nextauth', function(err) {
    if (err) {
        console.log(err);
    } else {
        console.log('Mongoose connection success');
    }
});

usersDAO.create([
    {name : 'bob', email : 'bob@example.com', password : 'secret'},
    {name : 'john', email : 'john@example.com', password : 'secret'},
    {name : 'smith', email : 'smith@example.com', password : 'secret'}
]);

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended : false}));
app.use(bodyParser.json());

// 몽고 커넥트를 이용해 세션이 잘 구워지는지 테스트.
// 도큐멘트를 조회하여 육안으로 확인할 수 있음.
// 대체 : app.use(session({secret : 'keyboard cat'}));
app.use(session({
    store : mongoStore,
    secret : 'secret',
    cookie : {expires : new Date(Date.now() + 3600000 * 24 * 15), maxAge : 3600000 * 24 * 15},
    resave : true,
    saveUninitialized : true
}));

app.use(myauth.initialize());
app.use(myauth.accountor());

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
