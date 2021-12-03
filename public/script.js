const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const myPeer = new Peer(undefined, {
  path: "/peerjs",
  host: "/",
  port: "3030",
});
const myroomid = ROOM_ID;
const myname = Name;
let myVideoStream;
const myVideodiv = document.createElement("div");
myVideodiv.className = "videodiv";
const mynamediv = document.createElement("div");
mynamediv.innerHTML = myname;
myVideodiv.append(mynamediv);
mynamediv.style.color = "white";
const myVideo = document.createElement("video");
myVideo.id = "myvideo";
myVideo.muted = true;
const peers = {};
var myid = 0;

const main__chat__window = document.getElementById("main__chat_window");
const chat = document.getElementById("chat");
OtherUsername = "";
// chat.hidden = true;


sendmessage = (text) => {
  if (event.key === "Enter" && text.value != "") {
    socket.emit("messagesend", myname + ' : ' + text.value);
    text.value = "";
    main__chat_window.scrollTop = main__chat_window.scrollHeight;
  }
};

//this function is to copy roomid on click
function copyroomID() {
  /* Get the text field */
  var copyText = document.getElementById("room_ID");
  copyText.select();
  copyText.setSelectionRange(0, 99999); 

  navigator.clipboard.writeText(copyText.value);

  alert("Copied the text: " + copyText.value);
}


//codeMIrror is used to give editor feel
//fromTextArea method helps us to get text from textarea box in which we write code
var codeArea = CodeMirror.fromTextArea(document.getElementById("code"), {
  lineNumbers: true,
  mode: "text/x-perl",
  theme: "abbott",
  lineWrapping: true,
});
//textarea size controller
codeArea.setSize("95%", "94%");
let input = document.querySelector("#input");
let output = document.querySelector("#output");

var conn;
//receiving open when successfully connected to peer server
myPeer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id, Name);
  console.log("my id is : " + id);
  myVideodiv.id = `videodiv-${id}`;
  myid = id;
});

//taking camera and audio permisions
navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideodiv, myVideo, stream);

    //if i receive a call  i have to answer it
    myPeer.on("call", (call) => {
      call.answer(stream);
      // console.log(call.peer);

      //when i get the other user stream i will add that stream to my window
      const videodiv = document.createElement("div");
      videodiv.id = `videodiv-${call.peer}`;
      videodiv.className = "videodiv";
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(videodiv, video, userVideoStream);
      });
    });

    //receiving
    socket.on("user-connected", (userId, Name) => {
      console.log("User connected");
      //set timeout so that it can get stream otherwise it will request without actually having stream
      setTimeout(function () {
        connectToNewUser(userId, stream, Name);
      }, 4000);
      socket.emit("tellName", Name);
    });
  });

codeArea.on("keydown", (cm) => {
  const text = cm.getValue();
  // console.log(text);
  socket.emit("code", text);
});

//here we check if user is entering stuff into input section
//then if the user tpyes in somrthing we emit an event called inpmsg
//this event is later caught below
input.addEventListener("keydown", (evt) => {
  const text = input.value;
  // console.log(text);
  // console.log("i am from input ");
  socket.emit("inpmsg", text);
});

//receiving
socket.on("code", (data) => {
  // console.log("rcvd msg in code");
  codeArea.getDoc().setValue(data);
});


//here we catch inpmsg event which is emitted above
//all sockets connected to the client will catch this event
socket.on("inpmsg", (data) => {
  input.value = data;
});
socket.on("outmsg", (data) => {
  // console.log("rcvd msg in output");
  output.value = data;
});

socket.on("AddName", (username) => {
  OtherUsername = username;
  console.log(username);
});

socket.on("createMessage", (message) => {
  var ul = document.getElementById("messageadd");
  var li = document.createElement("li");
  li.className = "message";
  li.appendChild(document.createTextNode(message));
  ul.appendChild(li);
});

socket.on("user-disconnected", (userId) => {
  if (peers[userId]) peers[userId].close();
});

const showchat = () => {
  if (chat.hidden == false) {
    chat.hidden = true;
  } else {
    chat.hidden = false;
  }
};


//************************************* connect to new user function **********************************************/
function connectToNewUser(userId, stream) {
  console.log(`connected to user id : ${userId}`);

  //now i will call the userid and send my stream to him
  const call = myPeer.call(userId, stream);

  //when i get the other user stream i will add that stream to my window
  const videodiv = document.createElement("div");
  videodiv.id = `videodiv-${userId}`;
  videodiv.className = "videodiv";
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(videodiv, video, userVideoStream);
  });
  call.on("close", () => {
    video.remove();
  });

  peers[userId] = call;

  //creating connection between the peers to send data
  //basically i am requesting the client to accept my connection
  conn = myPeer.connect(userId);
  //if he accepts create connection
  conn.on("open", function () {
    // Receive messages
    conn.on("data", function (data) {
      console.log("Received", data);
      let uservideodiv = document.querySelector(`#videodiv-${data.userid}`);
      if (data.name) {
        let namediv = document.createElement("div");
        namediv.innerHTML = data.name;
        namediv.style.color = "white";
        uservideodiv.append(namediv);
      }
      console.log(`${data.userid} user is muted`);
      setvideomutedtext(uservideodiv, data.muted, data.userid);
    });

    // Send messages
    conn.send({
      userid: myid,
      name: myname,
      muted: false
    });
  });
}

//*********************************** connect to new user function  (end)*****************************************/

//receive connection (the client will recive connection and display on the console)
var clientconn;
myPeer.on("connection", function (conn) {
  clientconn = conn;
  // console.log(conn);
  console.log("peer connection established");

  conn.on("open", function () {
    console.log("in open");
    // Receive messages
    conn.on("data", function (data) {
      console.log("Received ", data);
      console.log(`${data.userid} user is muted`);
      let uservideodiv = document.querySelector(`#videodiv-${data.userid}`);
      if (data.name) {
        let namediv = document.createElement("div");
        namediv.innerHTML = data.name;
        namediv.style.color = "white";
        uservideodiv.append(namediv);
      }
      setvideomutedtext(uservideodiv, data.muted, data.userid);
    });

    // Send messages
    conn.send({
      userid: myid,
      name: myname,
      muted: false
    });
  });
});

function addVideoStream(videodiv, video, stream) {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoGrid.append(videodiv);
  videodiv.append(video);
}

// const scrollToBottom = () => {
//   var d = $(".main__chat_window");
//   d.scrollTop(d.prop("scrollHeight"));
// };

const muteUnmute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
  } else {
    setMuteButton();
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
};

const playStop = () => {
  console.log("object");
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideo();
  } else {
    setStopVideo();
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
};

const setMuteButton = () => {
  const html = `
    <i class="fas fa-microphone"></i>
    <span>Mute</span>
  `;
  let div = document.querySelector(`#muteText-${myid}`);
  div.remove();
  document.querySelector(".main__mute_button").innerHTML = html;
  if (conn) {
    conn.send({
      userid: myid,
      muted: false
    });
  } else {
    clientconn.send({
      userid: myid,
      muted: false
    });
  }
};

const setUnmuteButton = () => {
  const html = `
    <i class="unmute fas fa-microphone-slash"></i>
    <span>Unmute</span>
  `;
  let div = document.createElement("div");
  div.setAttribute("class", "mutetext");
  div.id = `muteText-${myid}`;
  div.innerHTML = `
  <i class="unmute fas fa-microphone-slash"></i>
`;
  myVideodiv.appendChild(div);
  // document.querySelector(`#muteText-${myid}`).style.color = "black";
  document.querySelector(".main__mute_button").innerHTML = html;
  if (conn) {
    conn.send({
      userid: myid,
      muted: true
    });
  } else {
    clientconn.send({
      userid: myid,
      muted: true
    });
  }
};

const setStopVideo = () => {
  const html = `
    <i class="fas fa-video"></i>
    <span>Stop Video</span>
  `;
  document.querySelector(".main__video_button").innerHTML = html;
};

const setPlayVideo = () => {
  const html = `
  <i class="stop fas fa-video-slash"></i>
    <span>Play Video</span>
  `;
  document.querySelector(".main__video_button").innerHTML = html;
};

const setvideomutedtext = (videodiv, muted, id) => {
  if (muted) {
    let div = document.createElement("div");
    div.setAttribute("class", "mutetext");
    div.id = `muteText-${id}`;
    div.innerHTML = `
    <i class="unmute fas fa-microphone-slash"></i>
  `;
    videodiv.appendChild(div);
    // document.querySelector(`#muteText-${myid}`).style.color = "black";
  } else {
    let div = document.querySelector(`#muteText-${id}`);
    div.remove();
  }
};