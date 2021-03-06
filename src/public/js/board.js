const socket = io();

const canvas = document.getElementById("board");

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const cameraSelect = document.getElementById("cameras");
const call = document.getElementById("call");
const changeColorBtn = document.getElementById("changecolor");
const newLineBtn = document.getElementById("newline");
const newRectBtn = document.getElementById("newrectangle");
const myNameDisplay = call.querySelector("h2");

let myStream;
let muted = false; // 시작하면 toggle 되면서 Mute로 함
let camreaOff = false;
let roomName;
let mySelf; //myName;
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
        console.log("navigator:",navigator)
        console.log("navigator.mediaDevices:",navigator.mediaDevices)
        myStream = await navigator.mediaDevices.getUserMedia(
            deviceId? cameraConstraints : initialConstraints
        );
        myFace.srcObject = myStream;
        if (!deviceId) {
            await getCameras();
        }
        handleMuteClick();
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
async function handleWelcomeSubmit(event){ // create Room 
    event.preventDefault();
    const roomnameInput = welcomeForm.querySelector(".roomname");
    const nameInput = welcomeForm.querySelector(".name");
    await initCall();
    roomName = roomnameInput.value;
    mySelf = {
        name: nameInput.value,
        userId: socket.id
    };
    socket.emit("join_room", roomName, mySelf);
    myNameDisplay.innerText = `${mySelf.name} in ${roomName}`;
    nameInput.value = "";
}
welcomeForm.addEventListener("submit", handleWelcomeSubmit);

socket.on("welcome",async (senderProfile)=>{
    myDataChannel = myPeerConnection.createDataChannel("chat");
    myDataChannel.addEventListener("message", (event)=>{
        console.log(event.data);
    });
    console.log("made data channel from senderProfile=",senderProfile);
    const offer = await myPeerConnection.createOffer();
    myPeerConnection.setLocalDescription(offer);
    console.log('sent the offer');
    socket.emit("offer", offer, roomName);
});
socket.on("join_room_response", async(message)=>{
    console.log("join_room_response",message);
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


// Canvas data interface ----------------------------------------------------
// Define Common Variables 
const ctx = canvas.getContext('2d');
let myColor = '#aeaeae';
let myShapeNo = 1;
const colorValues = ['black','red','orange','yellow','green','blue','dark blue','purple','gray'];
let pickColorIdx = 0;

let config = { 
    lineWidth: 5, 
    lineColor: myColor, 
    fillColor: '#FFFFFF',
    owner: mySelf,
    defaultShapeSize: 50
}
let shapes = [];
const SHAPETYPE_LINE = "LINE"
const SHAPETYPE_RECT = "RECT"
let currentShape;
// ======================== LINE =====================================
function nextTask() {
    // console.log("nextTask() shapes:",shapes);
    if (currentShape.shapeType === SHAPETYPE_LINE) {
        newLine(); // defined in line.js
    }
    else if (currentShape.shapeType === SHAPETYPE_RECT) {
        // newRect(); // defined in line.js
    }
}
// newLine();

function handlerNewLine(event) {
    if (SHAPETYPE_RECT === "RECT") { 
        setEventListenerForRect();
    }
    newLine();
}
// function handlerNewRect(event) {
//     newRect();
// }
// for Buttons 
newLineBtn.addEventListener("click", handlerNewLine);
newRectBtn.addEventListener("click", setEventListenerForNewRect);
function handlerChangeColor(event) { // common for all shapes....
    pickColorIdx = (pickColorIdx + 1) % colorValues.length;
    changeColorBtn.style.color = colorValues[pickColorIdx];
    myColor = colorValues[pickColorIdx];
    config.lineColor = myColor;
    // changeColorBtn.style.border.color = myColor;
    if (currentShape === SHAPETYPE_LINE) {
        newLine(); // defined in line.js
    }
    else if (currentShape === SHAPETYPE_RECT) {
        // newRect(); // defined in line.js
    }
}
changeColorBtn.addEventListener("click", handlerChangeColor);

// For Sharing data among teams ==========================
async function sendData(shape ) {
    // console.log("sendData:",shape);
    socket.emit("sendDrawingData",shape , roomName, mySelf);
}
socket.on("sendDrawingData", async (shape,senderProfile ) =>{
    // console.log("sendDrawingData:",senderProfile,shape);
    const foundIndex = getIndexOfShape(shape);
    if (foundIndex === -1) {
        shapes.push(shape);
    } else {
        shapes[foundIndex] = shape;
    }
    if(shape.shapeType === SHAPETYPE_LINE) {
        drawLineForOther(shape,ctx);
    }
    if(shape.shapeType === SHAPETYPE_RECT) {
        drawRectForOther(shape,ctx);
    }
    // console.log(foundIndex,"shapes:",shapes);
})
function getIndexOfShape(shape) {
    let foundIndex = -1;
    for(let i = 0; i < shapes.length;i++) {
        if (shapes[i].owner.userId === shape.owner.userId 
            && shapes[i].shapeId === shape.shapeId ) {
                foundIndex = i;
            }
    }
    return foundIndex;
}

