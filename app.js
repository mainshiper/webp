const express = require("express"); // Express 모듈 불러오기
const app = express(); // Express 애플리케이션 생성
const path = require("path"); // 경로 모듈 불러오기
const http = require("http"); // HTTP 모듈 불러오기
const server = http.createServer(app); // HTTP 서버 생성
const socketIO = require("socket.io"); // Socket.IO 모듈 불러오기
const io = socketIO(server); // Socket.IO 서버 생성
require('dotenv').config(); // .env 파일 로드

const { initializeApp, applicationDefault, cert } = require('firebase-admin/app'); // Firebase Admin SDK 모듈 불러오기
const { getFirestore } = require('firebase-admin/firestore'); // Firestore 모듈 불러오기

// Firebase Admin SDK 초기화
const admin = require('firebase-admin'); // Firebase Admin 모듈 불러오기
const serviceAccount = require('./config/website-b8e72-firebase-adminsdk-moize-036ca72903.json'); // Firebase 서비스 계정 키 파일 경로

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount) // 서비스 계정 인증
});

const db = getFirestore(); // Firestore 인스턴스 초기화

app.use(express.static(path.join(__dirname, "src"))); // 정적 파일 제공 디렉터리 설정
const PORT = process.env.PORT || 5000; // 포트 설정 (환경 변수에서 가져오거나 기본값 5000)
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/src/homepage.html'); // 루트 경로로 접근 시 homepage.html 제공
});
app.get('/homepage', function (req, res) {
  res.sendFile(__dirname + '/src/homepage.html'); // /homepage 경로로 접근 시 homepage.html 제공
});

io.on("connection", async (socket) => { // 클라이언트가 연결되었을 때
  console.log('a user connected'); // 콘솔에 연결 메시지 출력

  socket.on('joinRoom', async (roomId) => { // 클라이언트가 방에 입장했을 때
    if (!roomId) {
      console.error('Room ID is not provided.'); // 방 ID가 제공되지 않은 경우 오류 메시지 출력
      return;
    }

    socket.join(roomId); // 클라이언트를 해당 방에 입장시키기
    console.log(`User joined room: ${roomId}`); // 방 입장 메시지 출력

    // 클라이언트가 연결되면 Firestore에서 채팅 기록을 불러와 전송
    try {
      const roomRef = db.collection('chats').doc(roomId); // Firestore에서 방 참조 생성
      const roomDoc = await roomRef.get(); // 방 문서 가져오기
      if (roomDoc.exists) {
        const chatHistory = roomDoc.data().messages || []; // 채팅 기록 가져오기
        socket.emit('loadChatHistory', chatHistory); // 클라이언트로 채팅 기록 전송
      } else {
        await roomRef.set({ messages: [] }); // 문서가 없으면 새 문서 생성
        socket.emit('loadChatHistory', []); // 빈 채팅 기록 전송
      }
    } catch (error) {
      console.error("Error loading chat history: ", error); // 채팅 기록 로드 오류 메시지 출력
    }
  });

  socket.on("chatting", async (data) => { // 클라이언트가 채팅 메시지를 보냈을 때
    const { name, msg, roomId } = data; // 데이터에서 이름, 메시지, 방 ID 추출
    if (!roomId) {
      console.error('Room ID is not provided.'); // 방 ID가 제공되지 않은 경우 오류 메시지 출력
      return;
    }

    const time = new Date().toISOString(); // ISO 형식으로 시간 저장
    const chatData = {
      name,
      msg,
      time
    };

    try {
      const roomRef = db.collection('chats').doc(roomId); // Firestore에서 방 참조 생성
      await roomRef.update({
        messages: admin.firestore.FieldValue.arrayUnion(chatData) // 메시지를 배열에 추가
      });
      io.to(roomId).emit("chatting", chatData); // 방에 있는 모든 클라이언트로 메시지 전송
      console.log("Message added to Firestore document"); // 메시지 저장 완료 메시지 출력
    } catch (error) {
      console.error("Error storing message in Firestore: ", error); // 메시지 저장 오류 메시지 출력
    }
  });

  socket.on("typing", (data) => { // 클라이언트가 입력 중일 때
    const { username, roomId } = data; // 데이터에서 사용자 이름과 방 ID 추출
    if (!roomId) {
      console.error('Room ID is not provided.'); // 방 ID가 제공되지 않은 경우 오류 메시지 출력
      return;
    }

    socket.to(roomId).emit("typing", { username }); // 방에 있는 다른 클라이언트로 입력 중 메시지 전송
  });

  socket.on("disconnect", () => { // 클라이언트가 연결을 끊었을 때
    console.log('user disconnected'); // 콘솔에 연결 종료 메시지 출력
  });
});

server.listen(PORT, () => console.log(`Server is running on port ${PORT}`)); // 서버 시작 및 포트에서 수신 대기
