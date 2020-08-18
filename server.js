let express = require('express');
let app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
let dateformat = require("dateformat");

//Set public Static Folder
app.use(express.static(__dirname + '/public'));
//Use View Engine
let expressHbs = require('express-handlebars');
let hbs = expressHbs.create({
    extname: 'hbs',
    defaultLayout: 'layout',
    layoutsDir: __dirname + '/views/layouts/',
    partialsDir: __dirname + '/views/partials/',
});
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');

// connect db
const mongoose = require('mongoose')
mongoose.connect("mongodb+srv://duyyugi:123456yugi@cluster0-l1xi3.mongodb.net/chatapp?retryWrites=true&w=majority", { useNewUrlParser: true, useUnifiedTopology: true })
const db = mongoose.connection
db.on('error', error => console.error(error))
db.once('open', () => console.log('Connected to Mongoose'))

//session
let session = require('express-session');
app.use(session({
    cookie: { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000 },
    secret: 's3cret',
    resave: false,
    saveUninitialized: false
}));

// body-parse
let bodyParse = require('body-parser');
app.use(bodyParse.urlencoded({ extended: false }))

let user;

app.use((req, res, next) => {
    user = req.session.user ? req.session.user : null;
    res.locals.isLoggedIn = req.session.user ? true : false;
    next();
})

// Require collection for saving messages;
let Message = require('./models/message');


// socketid
let socketArr = [];

io.on('connection', (socket) => {
    console.log('a user connected');
    let tokenUser = user ? user : null;
    let userIDArray = [];
    if (tokenUser) {
        tokenUser.socketID = socket.id;
        socketArr.push(tokenUser);
        for (let i in socketArr) {
            userIDArray.push({
                username: socketArr[i].username,
                name: socketArr[i].name,
                socketID: socketArr[i].socketID
            });
        }
        io.sockets.emit('send user list', userIDArray);
    }
    socket.on('disconnect', () => {
        let usernameDisconnect = [];
        console.log('user disconnected');
        if (socketArr.length > 0) {
            for (let i in socketArr) {
                if (socketArr[i].socketID == socket.id) {
                    socketArr.splice(i, 1);
                    break;
                }
            }
        }
        for (let i in userIDArray) {
            if (userIDArray[i].socketID == socket.id) {
                usernameDisconnect.push(userIDArray[i]);
                break;
            }
        }
        io.sockets.emit('a user offline', usernameDisconnect);
    });
    socket.on('send information of chat', (data) => {
        for (let i in socketArr) {
            if (socketArr[i].socketID == socket.id) {
                socketArr[i].receiverID = data;
                break;
            }
        }
    })
    socket.on('send message to server', (data) => {
        let receiverID;
        let receiverSocketID;
        let nameOfSender;
        let senderID;
        for (let i in socketArr) {
            if (socketArr[i].socketID == socket.id) {
                receiverID = socketArr[i].receiverID;
                nameOfSender = socketArr[i].name;
                senderID = socketArr[i]._id;
                break;
            }
        }
        for (let i in socketArr) {
            if (socketArr[i]._id == receiverID) {
                receiverSocketID = socketArr[i].socketID;
                break;
            }
        };
        let currentime = new Date();
        let timeFormatted = dateformat(currentime, 'HH:MM dd/mm');
        let messagePackage = {
            message: data,
            nameOfSender: nameOfSender,
            time: timeFormatted,
            receiverSocketID: receiverSocketID
        };
        let messageForSaving = new Message({
            content: data,
            senderID: senderID,
            receiverID: receiverID,
            time: timeFormatted
        });
        messageForSaving.save().then(() => {
            if (!receiverSocketID) {
                io.to(socket.id).emit('receive message from server', messagePackage);
            } else {
                for (let i in socketArr) {
                    if (socketArr[i].socketID == receiverSocketID) {
                        // if receiver have other their receiver that is not sender
                        if (socketArr[i].receiverID != senderID) {
                            io.to(socket.id).emit('receive message from server', messagePackage).to(receiverSocketID).emit('display messages of other receiver', messagePackage);
                        } else {
                            // they are connected to each other
                            io.to(receiverSocketID).to(socket.id).emit('receive message from server', messagePackage);
                        }
                        break;
                    }
                }
            }
        })
    })
});

app.use('/', require('./routes/indexRouter'));

const PORT = process.env.PORT || 3100;

http.listen(PORT, () => {
    console.log('listening on *:3100');
});


