// client/script.js
const socket = io();

document.getElementById('chat-form').addEventListener('submit', function (e) {
  e.preventDefault();
  const input = document.getElementById('message-input');
  if (input.value) {
    socket.emit('chat message', input.value);
    input.value = '';
  }
});

socket.on('chat message', function (msg) {
  const item = document.createElement('div');
  item.textContent = msg;
  document.getElementById('messages').appendChild(item);
  window.scrollTo(0, document.body.scrollHeight);
});

// Load previous messages
window.onload = async function () {
  const response = await fetch('/messages');
  const messages = await response.json();
  const messagesContainer = document.getElementById('messages');
  messages.forEach(message => {
    const item = document.createElement('div');
    item.textContent = message.content;
    messagesContainer.appendChild(item);
  });
};

