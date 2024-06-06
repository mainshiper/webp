
const express = require("express");
const app = express();
const path = require("path");
const http = require("http");
const server = http.createServer(app);
const socketIO = require("socket.io");
const moment =require("moment");
const io = socketIO(server);
require('dotenv').config(); // .env 파일에서 환경 변수를 로드하기 위해 필요합니다.
const Pusher = require('pusher');
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  encrypted: true
});

console.log(__dirname);

app.use(express.static(path.join(__dirname, "src")));
const PORT =process.env.PORT || 5000;
app.get('/homepage',function(요청,응답){
  응답.sendFile(__dirname + '/homepage.html')
});

io.on("connection", (socket)=>{
  socket.on("chatting", (data) => {
      const { name,msg } =data;
      io.emit("chatting",{
        name,
        msg,
        time: moment(new Date()).format("h:mm A")
      })
  })
    // Typing Indicator 이벤트 처리
    socket.on("typing", (data) => {
      const { username } = data;
      io.emit("typing", { username });
    })
})

server.listen(PORT, ()=>console.log(`server is runnig ${PORT}`));