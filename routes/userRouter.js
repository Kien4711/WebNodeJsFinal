const express = require('express')
require('dotenv').config()
const router = express.Router()
var bodyParser = require('body-parser');
let async = require('async');
const fs = require('fs');
const bcrypt = require('bcrypt')
const saltRounds = 10;
const moment = require('moment')


const accountSid = 'AC8dde70f912ce43b3e5a2d37b0490f6da'
const authToken = '288f9cab7684f34e32649156cd0ee170'
const client = require('twilio')(accountSid, authToken);

//validator form
const {check, validationResult} = require('express-validator')
const registerValidator = require('../routes/validators/registerValidator')


var cookieParser = require('cookie-parser');
const multiparty = require('multiparty');
router.use(bodyParser.urlencoded({ extended:false }))
router.use(bodyParser.json());

//db Model
const User = require('../models/userModel')
const Email = require('../models/mailModel')

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
}))

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
//get all Email
async function sentEmails() {
    try {
      const emails = await Email.find({ labels: 'sent' }).exec();
      console.log(emails);
      return emails;
    } catch (err) {
      console.error(err);
      return null;
    }
}
async function draftEmails() {
    try {
      const emails = await Email.find({ labels: 'draft' }).exec();
      console.log(emails);
      return emails;
    } catch (err) {
      console.error(err);
      return null;
    }
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

////////////////////login//////////////////////////////////////////////////////
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
    
    if (req.body.email == "admin@gmail.com" && req.body.password == "123456") {
        req.session.admin = true
        res.redirect('/admin')
    }
    else{
        const { email, password } = req.body
        User.findOne({ email: email})
        .then(user=>{
            if(!user){
                return res.json({code: 0, message: 'No User have this email'} + err.message)
            }
            else{
                let tmp_password = bcrypt.hash(password, 10)
                if(!compare(tmp_password, user.password)){
                    return res.json({code: 0, message: '{Password False}'} + err.message)
                }else{
                    res.redirect('/home')
                }
            }
        })
        .catch(err=>{
            return res.json({code: 0, message: 'Login Faild'} + err.message)
        })
    }
    res.render('login')
})

///////////////////register/////////////////////////////////////////////////////////////

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
            const otp = Math.floor(100000 + Math.random() * 900000);
            // Thời gian hết hạn của OTP: 10 phút sau khi khởi tạo
            const otpExpireTime = moment().add(10, 'minutes');

            // Lưu thời gian hết hạn vào session
            req.session.otpExpireTime = otpExpireTime;
            client.messages.create({
                body: `Your OTP ${otp}`,
                from: '+13203079027',
                to: phone
              }).then(message => {
                console.log(message.sid);
              }).catch(err => {
                console.log(err);
              });
            // Sử dụng session để lưu trữ tạm thời
            
            req.session.email = email
            req.session.phone = phone
            req.session.password = password
            req.session.name = fullname
            req.session.address = address
            req.session.birthday = birthday
            req.session.otp = otp

        //     let user = new User({
        //         email:email,
        //         phone:phone,
        //         name:fullname,
        //         address:address,
        //         birthday:new Date(birthday),
        //         password:password,
        //         otp:otp.toString(),
        //     })
        // user.save()
        })
        .then(() =>{
            return res.json({code: 0, message: 'Register OK'})
        })
        .catch(err =>{
            return res.json({code: 0, message: 'Register Faild'} + err.message)
        })
        res.redirect('/verify-otp')
    }
    res.render('register')
})


////////////////verify-otp//////////////////////////////////////////////////////////////////////////////////////////

router.get('/verify-otp', (req, res, next)=>{
    res.render('eOtp')
})

router.post('/verify-otp', (req, res, next)=>{
    const otp = req.body.otp
    const savedOtp = req.session.otp

    // Kiểm tra thời gian hết hạn của OTP
    const otpExpireTime = req.session.otpExpireTime;
    if (moment() > otpExpireTime) {
        // OTP đã hết hạn, thông báo cho người dùng và yêu cầu nhập lại mã OTP hoặc gửi lại mã mới
        res.render('verify-otp', { error: 'OTP was not useful, Resend' })
    } else {
    // OTP còn hạn, tiếp tục xử lý xác nhận tài khoản
        if (otp === savedOtp) {
            // Mã OTP chính xác
            // Xác nhận đăng ký tài khoản của người dùng
            const user = new User({
                email: req.session.email,
                phone: req.session.phone,
                name: req.session.name,
                address: req.session.address,
                birthday: req.session.birthday,
                password: req.session.password
            });
            user.save().then(() => {
            // Đăng ký tài khoản thành công
                res.redirect('/login')
            }).catch(err => {
                console.log(err)
                res.status(500).send('Đã xảy ra lỗi')
            });
        }
        else {
            // Mã OTP không chính xác
            // Yêu cầu người dùng nhập lại mã OTP hoặc gửi lại mã OTP mới
            res.render('verify-otp', { error: 'OTP code was invalid, please enter again.' })
        }
    }
})

/////////////////////////////////////////////////////////////////////
router.get('/home', (req, res) => {
    res.render('home')
})

router.post('/home', (req, res) => {

})

////////////////////////////Sent//////////////////////////////////////////
router.get('/home/sent', (req, res) => {

    res.render('home')
})
router.post('/home/sent', (req, res) => {

    res.render('home')
})

////////////////////////////Draft//////////////////////////////////////////
router.get('/home/draft', (req, res) => {

    res.render('home')
})
router.post('/home/draft', (req, res) => {

    res.render('home')
})












module.exports = router