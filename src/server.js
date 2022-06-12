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

wsServer.on("connection",(socket)=>{
    socket.on("join_room",(roomName,senderProfile)=>{
        socket.join(roomName);
        socket.to(roomName).emit("welcome",senderProfile);
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
    });
})

const handleListen = () => console.log("Listening on http://localhost:3000");
httpServer.listen(3000, handleListen);

