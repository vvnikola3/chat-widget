class MyChatWidget extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
      <style>
        .chat-container {
          position: fixed;
          bottom: 0;
          right: 20px;
          width: 300px;
          background: white;
          border: 1px solid #ccc;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          font-family: sans-serif;
          z-index: 1000;
        }
        .chat-header {
          background: #1c3f94;
          color: white;
          padding: 10px;
          border-radius: 8px 8px 0 0;
          cursor: pointer;
        }
        .chat-messages {
          max-height: 200px;
          overflow-y: auto;
          padding: 10px;
        }
        .chat-input {
          display: flex;
          border-top: 1px solid #ccc;
        }
        .chat-input input {
          flex: 1;
          border: none;
          padding: 10px;
        }
        .chat-input button {
          border: none;
          background: #1c3f94;
          color: white;
          padding: 10px;
          cursor: pointer;
        }
      </style>
      <div class="chat-container">
        <div class="chat-header">Chat with us!</div>
        <div class="chat-messages"></div>
        <div class="chat-input">
          <input type="text" placeholder="Type a message..." />
          <button>Send</button>
        </div>
      </div>
    `;
    }

    connectedCallback() {
        const sendButton = this.shadowRoot.querySelector('button');
        const input = this.shadowRoot.querySelector('input');
        const messages = this.shadowRoot.querySelector('.chat-messages');

        sendButton.addEventListener('click', () => {
            const text = input.value.trim();
            if (text) {
                const msg = document.createElement('div');
                msg.textContent = text;
                messages.appendChild(msg);
                input.value = '';
            }
        });
    }
}

customElements.define('my-chat-widget', MyChatWidget);
