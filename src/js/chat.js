"use strict";
const socket = io();

const chatlist = document.querySelector(".chatting-list");
const chatInput = document.querySelector(".chatting-input");
const sendButton = document.querySelector(".send-button");
const displayContainer = document.querySelector(".display-container");
const typingIndicator = document.querySelector('.typing-indicator');

let nickname = localStorage.getItem('nickname');
const roomId = localStorage.getItem('chatRoomId'); // 방 ID를 로컬 스토리지에서 가져옴

// 서버에 방 입장 요청
if (roomId) {
    socket.emit('joinRoom', roomId);
} else {
    console.error("Room ID is not set in local storage.");
}

// 채팅 보내는 함수
function send() {
    if (!roomId) {
        console.error("Room ID is not set. Cannot send message.");
        return;
    }
    
    const param = {
        name: nickname,
        msg: chatInput.value,
        roomId: roomId // 메시지에 방 ID 포함
    };

    socket.emit("chatting", param);

    chatInput.value = "";
}

// 전송 버튼 클릭 시 채팅 전송
sendButton.addEventListener("click", () => {
    send();
    hideTypingIndicator();
});

// 엔터를 누르면 채팅 전송
chatInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
        send();
        hideTypingIndicator();
    }
});

function hideTypingIndicator() {
    typingIndicator.style.display = 'none';
}

// 채팅 입력창에 입력 이벤트 리스너 추가
chatInput.addEventListener('input', () => {
    if (chatInput.value.trim() !== '') {
        socket.emit('typing', { username: nickname, roomId: roomId });
    } else {
        hideTypingIndicator();
    }
});

// 채팅 기록 로드 및 표시
socket.on("loadChatHistory", (messages) => {
    chatlist.innerHTML = ''; // 기존 채팅 기록을 지우고 새로 로드
    messages.forEach(data => {
        const { name, msg, time } = data;
        const formattedTime = new Date(time).toLocaleTimeString(); // 시간을 로컬 형식으로 변환
        const item = new LiModel(name, msg, formattedTime);
        item.makeLi();
    });
    displayContainer.scrollTo(0, displayContainer.scrollHeight);
});

socket.on("chatting", (data) => {
    const { name, msg, time } = data;
    const formattedTime = new Date(time).toLocaleTimeString(); // 시간을 로컬 형식으로 변환
    const item = new LiModel(name, msg, formattedTime);
    item.makeLi();
    displayContainer.scrollTo(0, displayContainer.scrollHeight);
});

// 서버로부터 Typing Indicator를 받아서 화면에 표시
socket.on('typing', (data) => {
    typingIndicator.style.display = 'block';
    typingIndicator.innerText = `${data.username}님이 입력 중입니다...`;

    setTimeout(() => {
        typingIndicator.style.display = 'none';
    }, 2000);
});

function LiModel(name, msg, time) {
    this.name = name;
    this.msg = msg;
    this.time = time;

    this.makeLi = () => {
        const li = document.createElement("li");
        li.classList.add(nickname === this.name ? "sent" : "received");

        let dom = '';
        if (nickname === this.name) {
            dom = `
                <span class="time">${this.time}</span>
                <span class="message">${this.msg}</span>`;
        } else {
            dom = `
                <span class="profile">
                    <span class="user">${this.name}</span>
                    <img class="image" src="https://www.urbanbrush.net/web/wp-content/uploads/2021/01/urbanbrush-20210105113834473495.jpg" alt="any">
                </span>
                <span class="message">${this.msg}</span>
                <span class="time">${this.time}</span>`;
        }

        li.innerHTML = dom;
        chatlist.appendChild(li);
    };
}
