"use strict"
const socket =io();

const nickname = document.querySelector("#nickname")
const chatlist = document.querySelector(".chatting-list")
const chatInput =document.querySelector(".chatting-input");
const sendButton =document.querySelector(".send-button");
const displayContainer = document.querySelector(".display-container");
// Typing Indicator를 표시할 요소 가져오기
const typingIndicator = document.querySelector('.typing-indicator');
//엔터를 누르면 채팅 전송
chatInput.addEventListener("keypress", (event)=>{
    if(event.key === "Enter") 
    {
        send()
        // 채팅을 전송하고 나면 Typing Indicator를 숨김
        hideTypingIndicator();
    }
})


function hideTypingIndicator() {
    // Typing Indicator를 숨김
    typingIndicator.classList.add('hidden');
}

// 채팅 입력창에 입력 이벤트 리스너 추가
chatInput.addEventListener('input', () => {
    // 입력창이 비어있지 않으면
    if (chatInput.value.trim() !== '') {
        // 서버로 'typing' 이벤트를 전송
        socket.emit('typing', { username: nickname.value });
    }
    else {
        hideTypingIndicator();
    }
});

//채팅 보내는 함수 부분
function send(){
    const param ={
        name:nickname.value,
        msg: chatInput.value
    }

    socket.emit("chatting",param)

     // 채팅 전송 후 채팅 입력란 비우기
    chatInput.value = "";
}

// 전송 버튼 클릭 시 채팅 전송 및 Typing Indicator 숨김
sendButton.addEventListener("click", () => {
    send();
     // 채팅을 전송하고 나면 Typing Indicator를 숨김
    hideTypingIndicator();
});


socket.on("chatting", (data)=>{
    console.log(data)
    const {name, msg, time} = data;
    const item = new LiModel(name, msg, time); //li모델 인스턴스화
    item.makeLi()
    displayContainer.scrollTo(0, displayContainer.scrollHeight)
})


// 서버로부터 Typing Indicator를 받아서 화면에 표시하는 함수
socket.on('typing', (data) => {
    // Typing Indicator를 표시
    typingIndicator.style.display = 'block';

    // Typing Indicator의 텍스트를 수정하여 누가 입력 중인지 표시
    typingIndicator.innerText = `${data.username}님이 입력 중입니다...`;

    // 1초 후에 Typing Indicator를 다시 숨김
    setTimeout(() => {
        typingIndicator.style.display = 'none';
    }, 2000);
});
function LiModel(name, msg, time){
    this.name =name;
    this.msg=msg;
    this.time = time;

    this.makeLi = ()=> {
        const li =document.createElement("li");
        li.classList.add(nickname.value === this.name ? "sent": "received")
        const dom=`<span class="profile">
        <span class="user">${this.name}</span>
        <img class="image" src="https://www.urbanbrush.net/web/wp-content/uploads/2021/01/urbanbrush-20210105113834473495.jpg" alt="any" >
        </span>
        <span class="message">${this.msg}</span>
        <span class="time">${this.time}</span>`;
    li.innerHTML =dom;
    chatlist.appendChild(li);
    }
}

