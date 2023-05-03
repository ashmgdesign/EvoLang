const keyData = {
    "0": { src: '/images/t_1-me.png', title: 'me', definition: 'me, I, my', id:'0' },
    "1": { src: '/images/t_2-we.png', title: 'we', definition: 'we, us, our', id:'1' },
    "2": { src: '/images/t_3-you.png', title: 'you', definition: 'you, your', id:'2' },
    "3": { src: '/images/t_4-they.png', title: 'you', definition: 'you, your', id:'3' },
    "4": { src: '/images/t_5-of.png', title: 'of', definition: 'you, your', id:'4' },
    "5": { src: '/images/t_6-good.png', title: 'good', definition: 'you, your', id:'5' },
    "6": { src: '/images/t_7-bad.png', title: 'you', definition: 'you, your', id:'6' },
    "7": { src: '/images/t_8-emphasis.png', title: 'you', definition: 'you, your', id:'7' },
    "8": { src: '/images/t_9-comma.png', title: 'you', definition: 'you, your', id:'8' },
    "9": { src: '/images/t_10-yes.png', title: 'you', definition: 'you, your', id:'9' },
    "10": { src: '/images/t_11-no.png', title: 'you', definition: 'you, your', id:'10' },
    "11": { src: '/images/t_12-place.png', title: 'you', definition: 'you, your', id:'11' },
    "12": { src: '/images/t_13-full stop.png', title: 'you', definition: 'you, your', id:'12' },
    "13": { src: '/images/t_14-question mark.png', title: 'you', definition: 'you, your', id:'13' },
    "14": { src: '/images/t_15-be.png', title: 'you', definition: 'you, your', id:'14' },
    "15": { src: '/images/t_16-different.png', title: 'you', definition: 'you, your', id:'15' },
    "16": { src: '/images/t_17-almost.png', title: 'you', definition: 'you, your', id:'16' },
    "17": { src: '/images/t_18-or.png', title: 'you', definition: 'you, your', id:'17' },
    "18": { src: '/images/t_19-wait.png', title: 'you', definition: 'you, your', id:'18' },
    "19": { src: '/images/t_20-ing.png', title: 'you', definition: 'you, your', id:'19' },
    "20": { src: '/images/t_21-and.png', title: 'you', definition: 'you, your', id:'20' }
};


class Site {
    constructor() {

        this.keys;
        this.lookup = {};
        this.popular;
        this.new;
        this.ui();
        this.sio;
        this.initSockets();
        this.fetchData()
        
        this.user = "Anon"
        this.currentMsg = [];

        this.bindEvents();
    }

    ui() {
        this._keyboard = document.querySelector('.keyboard .keyboard-inner');
        this._popularKeyboard = document.querySelector('.popular-keyboard .keyboard-inner');
        this._newestKeyboard = document.querySelector('.newest-keyboard .keyboard-inner');
        this._inputField = document.querySelector('.input-field');
        this._sendBtn = document.querySelector('.send');
        this._backBtn = document.querySelector('.backspace');
        this._msgField = document.querySelector('.message-list');
        this._usernameSubmit = document.querySelector('.usernameSubmit');
        this._username = document.querySelector('.username');
        this._overlay = document.querySelector('.overlay');
    }

    initSockets() {
        this.sio = io.connect();
        this.sio.on('chat message', function(msg) {
            this.msgReceived(msg);
        }.bind(this));
    }

    popularSort(a,b) {
        return b[4] - a[4];
    }

    fetchData() {
        fetch('/fetchKeys')
        .then(data => {
        return data.json();
        })
        .then(keys => {
            this.keys = keys;
            console.log(this.keys);
            for(let key=0; key<this.keys.length; key++) {
                this.lookup[this.keys[key][3]] = {img: this.keys[key][0], row:key, score:this.keys[key][4]};
            }
            this.new = this.keys.slice().reverse();
            this.new = this.new.slice(0,10); // get 10 newest;
            console.log(this.new);
            this.popular = this.keys.slice();
            this.popular.sort(this.popularSort);
            this.popular = this.popular.slice(0,10); // get top 10;
            console.log(this.popular);
            this.createKeyboard(this.popular, this._popularKeyboard);
            this.createKeyboard(this.new, this._newestKeyboard);
            this.createKeyboard(this.keys, this._keyboard);
        });
    }

    createKeyboard(keys, container) {
        for(let key=0; key<keys.length; key++) {
            const k = document.createElement('div');
            k.classList.add('key');
            k.setAttribute('data-title', keys[key][1]); // Set the title attribute for the key
            k.setAttribute('data-definition', keys[key][2]); // Set the definition attribute for the key
            k.setAttribute('data-id', keys[key][3]);
            const img = document.createElement('img');
            img.setAttribute('src', keys[key][0]);
            img.setAttribute('alt', keys[key][1]);
            k.appendChild(img);
            container.appendChild(k);
        }
    }

    bindEvents() {
        document.body.addEventListener("click", this.clicked.bind(this), true);
    }

    clicked(e) {
        if(e.target.closest(".key")) {
            e.stopPropagation();
            const el = e.target.closest(".key");
            const id = el.getAttribute('data-id');
            const img = el.querySelector('img');
            this.type(img, id)
        } else if(e.target.closest(".send")) {
            e.stopPropagation();
            console.log('here')
            this.sendMsg();
        } else if(e.target.closest(".backspace")) {
            e.stopPropagation();
            console.log('back')
            this.unType();
        } else if(e.target.closest(".usernameSubmit")) {
            e.stopPropagation();
            this.user = this._username.value;
            console.log(this.user);
            this.closeModal();
        }
    }

    closeModal() {
        this._overlay.style.display = 'none';
    }

    type(img, id) {
        let new_el = img.cloneNode(true);
        this._inputField.appendChild(new_el);
        this.currentMsg.push(id);
        console.log(this.currentMsg);
        const $this = this;
        setTimeout(function() {
            $this._inputField.scrollTo(0, $this._inputField.scrollHeight);
        }, 50)
        
    }

    unType(img, id) {
        if(!this.currentMsg.length) return;

        this.currentMsg = this.currentMsg.slice(0,-1);
        this._inputField.removeChild(this._inputField.lastChild);
        console.log(this.currentMsg);
        this._inputField.scrollTo(0, this._inputField.scrollHeight);
    }

    sendMsg() {

        // let data = []

        // for(var i=0; i<this.currentMsg.length; i++) {
        //     let ind = this.currentMsg[i];
        //     data.push(this.lookup[ind].row)
        // }

        // console.log(data);

        const options = {
          method: 'POST',
          body: JSON.stringify({'keys':this.currentMsg}),
          headers: {
            'content-type': 'application/json',
          },
        };

        fetch('/setData', options).then((response) => {
            console.log('success')
        })

        this.sio.emit("chat message", {msg: this.currentMsg.join(), user:this.user});
        this.currentMsg = [];
        this._inputField.innerHTML = "";
    }

    msgReceived(msg) {
        console.log(msg);
        let keys = msg.msg.split(',');
        const msgEl = document.createElement('div');
        msgEl.classList.add('msg');
        const userEl = document.createElement('div');
        userEl.classList.add('user');
        userEl.innerHTML = msg.user;
        msgEl.appendChild(userEl);
        for(const key of keys) {
            if(!key) break;
            const k = document.createElement('div');
            k.classList.add('msg-key');
            const img = document.createElement('img');
            img.setAttribute('src', this.lookup[key].img);
            k.appendChild(img);
            msgEl.appendChild(k);
        }
        this._msgField.appendChild(msgEl);
        this._msgField.scrollTo(0, this._msgField.scrollHeight);
    }
}

new Site();

