const socket = io();

const canvas = document.getElementById("board");

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const cameraSelect = document.getElementById("cameras");
const call = document.getElementById("call");
const myNameDisplay = call.querySelector("h2");

let myStream;
let muted = false;
let camreaOff = false;
let roomName;
let myName;
let myPeerConnection;
let myDataChannel;

async function getCameras(){
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter((device)=> device.kind === "videoinput");
        const currentCamera = myStream.getVideoTracks()[0];
        cameras.forEach((camera)=>{
            const option = document.createElement("option");
            option.value = camera.deviceId;
            option.innerText = camera.label;
            cameraSelect.appendChild(option);
            if(currentCamera.label == camera.label) {
                option.selected = true;
            }
        });
    } catch(e){
        console.log(e);
    }
}

async function getMedia(deviceId){
    const initialConstraints = {
        audio: true,
        video: {facingMode: "user"}
    };
    const cameraConstraints = {
        audio: true,
        video: { deviceId: {exact: deviceId}}
    };
    try {
        myStream = await navigator.mediaDevices.getUserMedia(
            deviceId? cameraConstraints : initialConstraints
        );
        myFace.srcObject = myStream;
        if (!deviceId) {
            await getCameras();
        }
    } catch(e){
        console.log(e);
    }
}

// getMedia();

function handleMuteClick() {
    console.log(myStream.getAudioTracks());
    myStream.getAudioTracks().forEach((track)=>(track.enabled = !track.enabled));
    if (!muted){
        muteBtn.innerText = "Unmute";
        muted = true;
    } else {
        muteBtn.innerText = "Mute";
        muted = false;
    }
}
function handleCemaraClick() {
    console.log(myStream.getVideoTracks());
    myStream.getVideoTracks().forEach((track)=>(track.enabled = !track.enabled));
    if (!camreaOff){
        cameraBtn.innerText = "Turn Camera On";
        camreaOff = true;
    } else {
        cameraBtn.innerText = "Turn Camera Off";
        camreaOff = false;
    }
}

async function handleCameraChange(){
    // console.log(cameraSelect.value);
    await getMedia(cameraSelect.value);
    if(myPeerConnection){
        // console.log(myPeerConnection.getSenders());
        const videoTrack = myStream.getVideoTracks()[0];
        const videoSender = myPeerConnection
                        .getSenders()
                        .find((sender)=>sender.track.kind === "video");
        videoSender.replaceTrack(videoTrack);
                        
    }
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCemaraClick);
cameraSelect.addEventListener("input", handleCameraChange);

// Wecome Form ( join a room )
const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");

call.hidden = true;

async function initCall(){
    welcome.hidden = true;
    call.hidden = false;
    await getMedia();
    makeConnection();
}
async function handleWelcomeSubmit(event){
    event.preventDefault();
    const roomnameInput = welcomeForm.querySelector(".roomname");
    const nameInput = welcomeForm.querySelector(".name");
    await initCall();
    roomName = roomnameInput.value;
    myName = nameInput.value;
    socket.emit("join_room", roomName, myName);
    myNameDisplay.innerText = myName;
    input.value = "";
}
welcomeForm.addEventListener("submit", handleWelcomeSubmit);

socket.on("welcome",async (myName)=>{
    myDataChannel = myPeerConnection.createDataChannel("chat");
    myDataChannel.addEventListener("message", (event)=>{
        console.log(event.data);
    });
    console.log("made data channel from myName=",myName);
    const offer = await myPeerConnection.createOffer();
    myPeerConnection.setLocalDescription(offer);
    console.log('sent the offer');
    socket.emit("offer", offer, roomName);
});

socket.on("offer", async (offer) =>{
    myPeerConnection.addEventListener("datachannel",(event)=>{
        myDataChannel = event.channel;
        myDataChannel.addEventListener("message",(event)=>{
            console.log(event.data);
        });
    });
    console.log("received the offer");
    myPeerConnection.setRemoteDescription(offer);
    const answer = await myPeerConnection.createAnswer();
    console.log(answer);
    myPeerConnection.setLocalDescription(answer);
    socket.emit("answer", answer, roomName);
})

socket.on("answer", answer=>{
    console.log("received the answer");
    myPeerConnection.setRemoteDescription(answer);
});

socket.on("ice", ice=>{
    console.log("received candidate");
    myPeerConnection.addIceCandidate(ice);
});

function makeConnection(){
    myPeerConnection = new RTCPeerConnection({
        iceServers:[
            {
                urls: [
                    "stun:stun.l.google.com:19302",
                    "stun:stun1.l.google.com:19302",
                    "stun:stun2.l.google.com:19302",
                    "stun:stun3.l.google.com:19302",
                    "stun:stun4.l.google.com:19302",
                ]
            }
        ]
    });
    // console.log(myStream.getTracks());
    myPeerConnection.addEventListener("icecandidate", handleIce);
    myPeerConnection.addEventListener("addstream", handleAddStream);
    myStream.getTracks().forEach(
        track => myPeerConnection.addTrack(track, myStream)
    );
}

function handleIce(data){
    console.log("sent candidate");
    socket.emit("ice",data.candidate, roomName);
}

function handleAddStream(data){
    const peerFace = document.getElementById("peerFace");
    peerFace.srcObject = data.stream;
}


// Canvas data interface
const ctx = canvas.getContext('2d');
let drawingBrush = { eventType: "Start" ,x: 0, y: 0 , color: '#ACD3ED' , width: 5};
canvas.addEventListener('mousedown', start);
canvas.addEventListener('mouseup', stop);

async function sendData(drawingBrushBegin,drawingBrushEnd ) {
    socket.emit("sendDrawingData",drawingBrushBegin,drawingBrushEnd , roomName, myName);
}
socket.on("sendDrawingData", async (drawingBrushBegin,drawingBrushEnd,myName ) =>{
    console.log(myName,drawingBrushBegin,drawingBrushEnd);
})

// canvas.addEventListener('resize', resize);
function start(event) {
    canvas.addEventListener('mousemove', draw);
    reposition(event,"Start");
}
function reposition(event,eventType) {
    drawingBrush.x = event.clientX - canvas.offsetLeft;
    drawingBrush.y = event.clientY - canvas.offsetTop;
    drawingBrush.eventType = eventType;
    sendData();
    // coord.x = event.clientX ;
    // coord.y = event.clientY ;
}
function stop() {
    canvas.removeEventListener('mousemove', draw);
    drawingBrush.eventType = "End";

}
function draw(event) {
    const drawingBrushBegin = drawingBrush;
    ctx.beginPath();
    ctx.lineWidth = drawingBrush.width;
    ctx.lineCap = 'round';
    ctx.strokeStyle = drawingBrush.color;
    ctx.moveTo(drawingBrush.x, drawingBrush.y);
    reposition(event,"Move");
    ctx.lineTo(drawingBrush.x, drawingBrush.y);
    ctx.stroke();
    const drawingBrushEnd = drawingBrush;
    sendData(drawingBrushBegin,drawingBrushEnd );
}
