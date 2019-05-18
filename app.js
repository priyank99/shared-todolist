//  configuration
process.env.TZ = 'Asia/Calcutta';
process.env.SESSIONSECRET = "jkresgbkhsebkhuegrsh ifenbio node js todo app";
process.env.ADMINCODE = 'asyncpromise';
let env = process.env.NODE_ENV || 'development';
if (env === 'development') {
    process.env.MONGODBURL = 'mongodb+srv://td-uo:bXH8RsVumEq5gxSa@cluster0-lhrxx.mongodb.net/td?retryWrites=true';
} else if (env === 'test') {
    process.env.MONGODBURL = 'mongodb+srv://td-uo:bXH8RsVumEq5gxSa@cluster0-lhrxx.mongodb.net/todotest?retryWrites=true';
}

const express = require("express"),
    app = express(),
    mongoose = require("mongoose"),
    passport = require("passport"),
    LocalStrategy = require("passport-local"),
    passportLocalMongoose = require("passport-local-mongoose"),
    session = require("express-session"),
    flash = require("connect-flash"),
    middleware = require("./middleware");

var createError = require('http-errors');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');

mongoose.connect(process.env.MONGODBURL, {
    useNewUrlParser: true
}, function (err, db) {
    if (err) {
        console.log("Mongoose: connection err \n" + err);
    } else {
        console.log('connected to '+process.env.MONGODBURL);
    }
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(flash());
app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({
    extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//Requiring the Models
const User = require("./models/user.js");
const list = require("./models/list.js");

//passport configuration
app.use(session({
    secret: process.env.SESSIONSECRET,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
// pass currentUser to all routes
app.use((req, res, next) => {
    res.locals.currentUser = req.user; // req.user is an authenticated user
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

// routes
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var listsRouter = require('./routes/lists');

app.use('/', indexRouter);
app.use('/user', usersRouter);
app.use('/list', listsRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = env === 'development' ? err : {};
    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;