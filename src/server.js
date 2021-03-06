import http from "http";
import SocketIO from "socket.io";
import express from "express";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req,res)=> res.render("home"));
app.get("/board", (req,res)=> res.render("board"));
app.get("/*", (req,res)=> res.redirect("/"));

const httpServer = http.createServer(app);
const wsServer  = SocketIO(httpServer);

let roomList = {}
function registerRoom(roomName,senderProfile) {
    let room = roomList[roomName];
    if (!room) {
        room = {}
        roomList[roomName] = room;
    }
    room[senderProfile.userId] = senderProfile;
}
wsServer.on("connection",(socket)=>{
    socket.on("join_room",(roomName,senderProfile)=>{
        registerRoom(roomName,senderProfile); 
        socket.join(roomName);
        socket.to(roomName).emit("welcome",senderProfile);
        socket.emit("join_room_response","You are added into the room:"+roomName);
    });
    socket.on("offer",(offer,roomName)=>{
        socket.to(roomName).emit("offer", offer);
    });
    socket.on("answer", (answer, roomName)=>{
        socket.to(roomName).emit("answer", answer);
    });
    socket.on("ice",(ice,roomName)=>{
        socket.to(roomName).emit("ice",ice);
    });
    socket.on("sendDrawingData",(shape , roomName,senderProfile)=>{
        socket.to(roomName).emit("sendDrawingData",shape, senderProfile );
        syncShapes(roomName,shape); 
    });
})

let localDBCache = {} // temparary 
async function syncShapes(roomName,shape) {
    let shapes = localDBCache.get(roomName);
    if (!shapes) {
        shapes = {};
        shapes[roomName] = shape;
    } else {
        const foundIndex = getIndexOfShape(shapes, shape);
        if (foundIndex === -1) {
            shapes.push(shape);
        } else {
            shapes[foundIndex] = shape;
        }
    }
}

function getIndexOfShape(shapes, shape) {
    let foundIndex = -1;
    for(let i = 0; i < shapes.length;i++) {
        if (shapes[i].owner.userId === shape.owner.userId 
            && shapes[i].shapeId === shape.shapeId ) {
                foundIndex = i;
            }
    }
    return foundIndex;
}

const handleListen = () => console.log("Listening on http://localhost:3000");
httpServer.listen(3000, handleListen);

