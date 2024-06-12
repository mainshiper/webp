const express = require("express");
const app = express();
const path = require("path");
const http = require("http");
const server = http.createServer(app);
const socketIO = require("socket.io");
const io = socketIO(server);
require('dotenv').config();
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Firebase Admin SDK 초기화
const admin = require('firebase-admin');
const serviceAccount = require('./config/website-b8e72-firebase-adminsdk-moize-036ca72903.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = getFirestore();

app.use(express.static(path.join(__dirname, "src")));
const PORT = process.env.PORT || 5000;
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/src/homepage.html');
});
app.get('/homepage', function (req, res) {
  res.sendFile(__dirname + '/src/homepage.html');
});


io.on("connection", async (socket) => {
  console.log('a user connected');

  socket.on('joinRoom', async (roomId) => {
    if (!roomId) {
      console.error('Room ID is not provided.');
      return;
    }

    socket.join(roomId);
    console.log(`User joined room: ${roomId}`);

    // 클라이언트가 연결되면 Firestore에서 채팅 기록을 불러와 전송
    try {
      const roomRef = db.collection('chats').doc(roomId);
      const roomDoc = await roomRef.get();
      if (roomDoc.exists) {
        const chatHistory = roomDoc.data().messages || [];
        socket.emit('loadChatHistory', chatHistory);
      } else {
        await roomRef.set({ messages: [] });
        socket.emit('loadChatHistory', []);
      }
    } catch (error) {
      console.error("Error loading chat history: ", error);
    }
  });

  socket.on("chatting", async (data) => {
    const { name, msg, roomId } = data;
    if (!roomId) {
      console.error('Room ID is not provided.');
      return;
    }

    const time = new Date().toISOString(); // ISO 형식으로 시간 저장
    const chatData = {
      name,
      msg,
      time
    };

    try {
      const roomRef = db.collection('chats').doc(roomId);
      await roomRef.update({
        messages: admin.firestore.FieldValue.arrayUnion(chatData)
      });
      io.to(roomId).emit("chatting", chatData);
      console.log("Message added to Firestore document");
    } catch (error) {
      console.error("Error storing message in Firestore: ", error);
    }
  });

  socket.on("typing", (data) => {
    const { username, roomId } = data;
    if (!roomId) {
      console.error('Room ID is not provided.');
      return;
    }

    socket.to(roomId).emit("typing", { username });
  });

  socket.on("disconnect", () => {
    console.log('user disconnected');
  });
});

server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
