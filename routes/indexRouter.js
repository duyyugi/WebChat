let express = require('express');
let router = express.Router();
let User = require('../models/user');
let Message = require('../models/message');
let dateformat = require('dateformat');

router.get('/', async (req, res) => {
    if (!req.session.user) {
        res.redirect('/login')
    } else {
        res.render("index", {
            name: req.session.user.name,
        });
    }
})

router.get('/login', (req, res) => {
    if (!req.session.user) {
        res.render("login");
    } else {
        res.render("login", {
            name: req.session.user.name
        });
    }
})
router.post('/login', async (req, res, next) => {
    try {
        // check username
        let usernameLogin = req.body.usernameLogin;
        let checkUsername = await User.findOne({ username: usernameLogin });
        if (!checkUsername) {
            res.render("login", {
                checkUsernameFailed: true,
            })
        } else {
            let passwordLogin = req.body.passwordLogin;
            if (checkUsername.password == passwordLogin) {
                req.session.user = checkUsername;
                res.locals.isLoggedIn = true;
                res.render("index", {
                    name: req.session.user.name,
                    user: req.session.user
                });
            } else {
                res.render("login", {
                    checkPasswordFailed: true,
                })
            }

        }
    } catch (err) {
        next(err);
    }
})

router.get('/logout', async (req, res, next) => {
    try {
        req.session.destroy()
        return res.redirect('/')
    } catch (err) {
        next(err);
    }
})

router.get('/chat', async (req, res) => {
    if(!req.session.user){
        res.redirect('/login');
    }else{
        let name = req.session.user ? req.session.user.name : '';
        let allUser = await User.find({ _id: { $ne: req.session.user._id } });
        let remHeight = allUser.length * 6.5;
        if(remHeight > 30){
            remHeight = 30;
        }
        res.render("chat", {
            name: name,
            Users: allUser,
            remHeight:remHeight
        });
    }
})


router.post('/chat-now', async (req, res, next) => {
    try {
        let sender = req.session.user;
        let senderID = req.session.user._id;
        let receiverID = req.body.receiverID
        let receiver = await User.findOne({ _id: receiverID }).select(['name','username']);
        let messages = await Message.find({ $or: [{ senderID: senderID, receiverID: receiverID }, { senderID: receiverID, receiverID: senderID }] }).populate('senderID', 'name').exec();
        let nameUsernameReceiver = receiver.name+" ("+receiver.username+")";
        let data = {
            sender: sender,
            messages: messages,
            nameUsernameReceiver: nameUsernameReceiver
        }
        res.json(data);
    } catch (err) {
        next(err);
    }
})

router.get('/register', async (req, res, next) => {
    res.render("register");
})

router.post('/register', async (req, res, next) => {
    try {
        // check username
        let username = req.body.usernameRegister;
        let checkUser = await User.findOne({ username: username }).select('_id').exec();
        if (checkUser) {
            res.render("register", {
                checkUsernameFailed: true
            })
        } else {
            //check password
            let password1 = req.body.passwordRegister1;
            let password2 = req.body.passwordRegister2;
            if (password1 != password2) {
                res.render("register", {
                    checkPasswordFailed: true
                })
            }
            else {
                let newUser = new User({
                    username: req.body.usernameRegister,
                    password: req.body.passwordRegister1,
                    name: req.body.nameRegister
                });
                await newUser.save();
                res.render("login", {
                    RegisterSuccessful: true
                })
            }
        }
    } catch (err) {
        console.log(err);
    }
})

module.exports = router;