const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const {
    ExpressPeerServer
} = require("peer");
const peerServer = ExpressPeerServer(server, {
    debug: true,
});
const {
    v4: uuidV4
} = require("uuid");

app.use("/peerjs", peerServer);

app.set("view engine", "ejs");
app.use(express.static("public"));

app.get("/", (req, res) => {
    res.render("index");
});

app.get("/room", (req, res) => {
    console.log(req.query.roomId);
    if (!req.query.roomid) {
        console.log(true);
        let roomid = uuidV4();
        res.render("room", {
            roomId: roomid,
            name: req.query.name
        });
    } else {
        res.render("room", {
            roomId: req.query.roomid,
            name: req.query.name
        });
    }
});

io.on("connection", (socket) => {
    socket.on("join-room", (roomId, userId, Name) => {
        console.log("This is room and user id ", roomId, userId, Name);
        socket.join(roomId);
        socket.broadcast.to(roomId).emit("user-connected", userId,Name);

        // messages
        socket.on("code", (message) => {
            //send message to the same room
            // console.log("msg come to sever via msg");
            socket.broadcast.to(roomId).emit("code", message);
        });
        //this event is emitted for every keydown
        //and is caught for every keydown and input is updated accordingly
        socket.on("inpmsg", (message) => {
            //send message to the same room
            // console.log("msg come to sever via inpmsg");
            socket.broadcast.to(roomId).emit("inpmsg", message);
        });

        socket.on("messagesend", (message) => {
            console.log(message);
            io.to(roomId).emit("createMessage", message);
        });

        socket.on("tellName", (Name) => {
            console.log(Name);
            socket.broadcast.to(roomId).emit("AddName", Name);
        });


        //this event is received by the server and is emitted to all the sockets except the socket which emitted
        socket.on("outmsg", (message) => {
            //send message to the same room
            // console.log("msg come to sever via outmsg");
            socket.broadcast.to(roomId).emit("outmsg", message);
        });

        socket.on("disconnect", () => {
            socket.broadcast.to(roomId).emit("user-disconnected", userId);
        });
    });
});

server.listen(6969);