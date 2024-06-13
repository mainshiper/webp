"use strict";
const socket = io(); // 소켓 초기화

const chatlist = document.querySelector(".chatting-list"); // 채팅 리스트 요소 선택
const chatInput = document.querySelector(".chatting-input"); // 채팅 입력 요소 선택
const sendButton = document.querySelector(".send-button"); // 전송 버튼 요소 선택
const displayContainer = document.querySelector(".display-container"); // 디스플레이 컨테이너 요소 선택
const typingIndicator = document.querySelector('.typing-indicator'); // 입력 중 표시 요소 선택

let nickname = localStorage.getItem('nickname'); // 닉네임을 로컬 스토리지에서 가져옴
const roomId = localStorage.getItem('chatRoomId'); // 방 ID를 로컬 스토리지에서 가져옴

// 서버에 방 입장 요청
if (roomId) {
    socket.emit('joinRoom', roomId); // 방 입장 요청 이벤트 전송
} else {
    console.error("Room ID is not set in local storage."); // 방 ID가 설정되지 않은 경우 오류 메시지 출력
}

// 채팅 보내는 함수
function send() {
    if (!roomId) {
        console.error("Room ID is not set. Cannot send message."); // 방 ID가 설정되지 않은 경우 오류 메시지 출력
        return;
    }
    
    const param = {
        name: nickname, // 닉네임
        msg: chatInput.value, // 입력된 채팅 메시지
        roomId: roomId // 방 ID
    };

    socket.emit("chatting", param); // 채팅 이벤트 전송

    chatInput.value = ""; // 입력 필드 초기화
}

// 전송 버튼 클릭 시 채팅 전송
sendButton.addEventListener("click", () => {
    send(); // 채팅 전송 함수 호출
    hideTypingIndicator(); // 입력 중 표시 숨기기
});

// 엔터를 누르면 채팅 전송
chatInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
        send(); // 채팅 전송 함수 호출
        hideTypingIndicator(); // 입력 중 표시 숨기기
    }
});

// 입력 중 표시 숨기기 함수
function hideTypingIndicator() {
    typingIndicator.style.display = 'none'; // 입력 중 표시 숨기기
}

// 채팅 입력창에 입력 이벤트 리스너 추가
chatInput.addEventListener('input', () => {
    if (chatInput.value.trim() !== '') {
        socket.emit('typing', { username: nickname, roomId: roomId }); // 입력 중 이벤트 전송
    } else {
        hideTypingIndicator(); // 입력 중 표시 숨기기
    }
});

// 채팅 기록 로드 및 표시
socket.on("loadChatHistory", (messages) => {
    chatlist.innerHTML = ''; // 기존 채팅 기록을 지우고 새로 로드
    messages.forEach(data => {
        const { name, msg, time } = data;
        const formattedTime = new Date(time).toLocaleTimeString(); // 시간을 로컬 형식으로 변환
        const item = new LiModel(name, msg, formattedTime); // 채팅 항목 생성
        item.makeLi(); // 채팅 항목 추가
    });
    displayContainer.scrollTo(0, displayContainer.scrollHeight); // 스크롤을 맨 아래로 이동
});

// 새로운 채팅 메시지를 받았을 때 처리
socket.on("chatting", (data) => {
    const { name, msg, time } = data;
    const formattedTime = new Date(time).toLocaleTimeString(); // 시간을 로컬 형식으로 변환
    const item = new LiModel(name, msg, formattedTime); // 채팅 항목 생성
    item.makeLi(); // 채팅 항목 추가
    displayContainer.scrollTo(0, displayContainer.scrollHeight); // 스크롤을 맨 아래로 이동
});

// 서버로부터 Typing Indicator를 받아서 화면에 표시
socket.on('typing', (data) => {
    typingIndicator.style.display = 'block'; // 입력 중 표시 보이기
    typingIndicator.innerText = `${data.username}님이 입력 중입니다...`; // 입력 중인 사용자 표시

    setTimeout(() => {
        typingIndicator.style.display = 'none'; // 2초 후 입력 중 표시 숨기기
    }, 2000);
});

// 채팅 항목 모델
function LiModel(name, msg, time) {
    this.name = name; // 이름 설정
    this.msg = msg; // 메시지 설정
    this.time = time; // 시간 설정

    // 채팅 항목을 생성하여 목록에 추가하는 함수
    this.makeLi = () => {
        const li = document.createElement("li"); // li 요소 생성
        li.classList.add(nickname === this.name ? "sent" : "received"); // 보낸 메시지와 받은 메시지 구분

        let dom = '';
        if (nickname === this.name) {
            dom = `
                <span class="time">${this.time}</span>
                <span class="message">${this.msg}</span>`; // 보낸 메시지 템플릿
        } else {
            dom = `
                <span class="profile">
                    <span class="user">${this.name}</span>
                    <img class="image" src="https://www.urbanbrush.net/web/wp-content/uploads/2021/01/urbanbrush-20210105113834473495.jpg" alt="any">
                </span>
                <span class="message">${this.msg}</span>
                <span class="time">${this.time}</span>`; // 받은 메시지 템플릿
        }

        li.innerHTML = dom; // li 요소에 템플릿 추가
        chatlist.appendChild(li); // 채팅 목록에 li 요소 추가
    };
}
