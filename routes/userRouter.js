const express = require('express')
const router = express.Router()
var bodyParser = require('body-parser');
let async = require('async');
const fs = require('fs');
const bcrypt = require('bcrypt')
const saltRounds = 10;


//validator form
const {check, validationResult} = require('express-validator')
const registerValidator = require('../routes/validators/registerValidator')

// var mv = require('mv');
var cookieParser = require('cookie-parser');
const multiparty = require('multiparty');
router.use(bodyParser.urlencoded({ extended:false }))
router.use(bodyParser.json());

//db Model
const User = require('../models/userModel')

const mongoose = require("mongoose");
db = require("../libs/db")
const urlencodedParser = bodyParser.urlencoded({ extended: false })


//session
const session = require('express-session')

router.use(session({
    secret: 'buitrungkien',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 10 * 60 * 1000 } // Thời gian sống của cookie là 10 phút
}));

//function
function makeid(length) {
    var result = '';
    var characters = '0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

async function hashpass(password) {
    const salt = await bcrypt.genSalt(10);
    const secPass = await bcrypt.hash(password, salt)
    return new Promise(function(res, rej) {
        res(secPass)
    })
}
async function compare(text, hash) {
    let check = await bcrypt.compare(text, hash);
    return check
}
//resful API
router.get('/', function(req, res) {
    if (req.session.admin) {
        res.redirect('/admin')
    }
    if (req.session.email) {
        return res.render('login', { status: req.session.Status, name: req.session.Fullname });
    }
    return res.render('index', { status: 100 })
})
router.get('/login', function(req, res) {
    if (req.session.admin) {
        res.redirect('/admin')
    }
    if (req.session.email) {
        return res.redirect('/');
    }
    return res.render('login', { status: 100 })
})
router.post('/login', (req, res) => {
    const { email, password } = req.body
    
    if (req.body.email == "admin@gmail.com" && req.body.password == "123456") {
        req.session.admin = true
        res.redirect('/admin')
    }
})
router.get('/register',registerValidator,(req, res) => {
    res.render('register', { status: 100 })
})
router.post('/register',(req, res)=>{
    const result = validationResult(req)
    
    if(result.errors.length === 0){
        const { email, phone, address,fullname, birthday, password } = req.body
        User.findOne({ email: email})
        .then(user =>{
            if(user){
                throw new Error('Email has been existing')
            }
        })
        .then(() =>bcrypt.hash(password, 10))
        .then(hashed =>{
            let user = new User({
                email:email,
                phone:phone,
                name:fullname,
                address:address,
                birthday:new Date(birthday),
                password:password
            })
            return user.save()
        })
        .then(() =>{
            return res.json({code: 0, message: 'Register OK'})
        })
        .catch(err =>{
            return res.json({code: 0, message: 'Register Faild'} + err.message)
        })
    }

})

module.exports = router