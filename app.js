const express = require("express");
const app = express();
const path = require("path");
const http = require("http");
const server = http.createServer(app);
const socketIO = require("socket.io");
const moment = require("moment");
const io = socketIO(server);
require('dotenv').config(); // .env 파일에서 환경 변수를 로드하기 위해 필요합니다.
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');

// Firebase Admin SDK 초기화
const admin = require('firebase-admin');
const serviceAccount = require('./config/website-b8e72-firebase-adminsdk-moize-036ca72903.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = getFirestore();

console.log(__dirname);

app.use(express.static(path.join(__dirname, "src")));
const PORT = process.env.PORT || 5000;
app.get('/homepage', function (req, res) {
  res.sendFile(__dirname + '/homepage.html');
});

io.on("connection", (socket) => {
  socket.on("chatting", async (data) => {
    const { name, msg } = data;
    const time = moment(new Date()).format("h:mm A");
    io.emit("chatting", {
      name,
      msg,
      time
    });

    // Firestore에 채팅 메시지 저장
    try {
      await db.collection('chats').add({
        name,
        msg,
        time: new Date()
      });
      console.log("Message stored in Firestore");
    } catch (error) {
      console.error("Error storing message in Firestore: ", error);
    }
  });

  // Typing Indicator 이벤트 처리
  socket.on("typing", (data) => {
    const { username } = data;
    io.emit("typing", { username });
  });
});

server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
