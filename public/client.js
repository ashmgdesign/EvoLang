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
        this.currentDefs;
        this.currentId;

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
        this._defOverlay = document.querySelector('.def-overlay');
        this._definition = document.querySelector('.definition');
        this._definitionWrapper = document.querySelector('.definitions');
        this._definitionsList = document.querySelector('.definitions-list');
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
            keys.shift();
            console.log(keys);
            this.keys = keys;
            console.log(this.keys);
            for(let key=0; key<this.keys.length; key++) {
                this.lookup[this.keys[key][3]] = {img: this.keys[key][0], row:key, score:this.keys[key][4]};
            }
            this.new = this.keys.slice().reverse();
            this.new = this.new.slice(0,11); // get 10 newest;
            console.log(this.new);
            this.popular = this.keys.slice();
            this.popular.sort(this.popularSort);
            this.popular = this.popular.slice(0,11); // get top 10;
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
            let def = null
            if(keys[key][2]) {
                console.log(keys[key][2])
                def = JSON.stringify(JSON.parse(keys[key][2]));
            }

            k.setAttribute('data-definition', def); // Set the definition attribute for the key
            
            k.setAttribute('data-id', keys[key][3]);
            const img = document.createElement('img');
            img.setAttribute('src', '/images/'+keys[key][0]);
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
            const def = el.getAttribute('data-definition');
            let def2 = "Undefined";
            if(def != "null") {
                let json = JSON.parse(def);
                this.currentDefs = json;
                this.currentId = id;
                def2 = json[Object.keys(json)[0]]
                console.log(def2);
            }
            this.type(img, id, def2)
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
            
            this.closeModal();
        } else if(e.target.closest(".edit")) {
            e.stopPropagation();
            this.openEdit();
        } else if(e.target.closest(".definitionSubmit")) {
            e.stopPropagation();
            this.submitDefinition();
        } else if(e.target.closest('.def-item-up')) {
            e.stopPropagation();
            const key = e.target.closest('.def-item-up').getAttribute('data-key');
            this.upvote(key);
        }
    }

    

    closeModal() {
        if(this._username.value == "") return;
        this.user = this._username.value;
        console.log(this.user);
        this._overlay.style.display = 'none';
    }

    upvote(key) {

        const $this = this;
        const options = {
          method: 'POST',
          body: JSON.stringify({'keys':[this.currentId], 'def':key}),
          headers: {
            'content-type': 'application/json',
          },
        };

        fetch('/upvoteDef', options).then((response) => {
            console.log('success')
            this.closeEdit();
        })
    }

    openEdit() {
        this._defOverlay.style.display = 'flex';
        let keys = Object.keys(this.currentDefs);
        let scores = JSON.parse(this.keys[this.currentId-1][6]);
        console.log(scores)
        for(let key of keys) {
            const defEl = document.createElement('div');
            defEl.classList.add('def-item');
            defEl.setAttribute('data-key', key);
            defEl.innerHTML = this.currentDefs[key];

            const upEl = document.createElement('div');
            upEl.classList.add('def-item-up');
            upEl.innerHTML = '<a href="#" class="upvote">Upvote (<span>'+scores[key]+'</span>)</a>';
            upEl.setAttribute('data-key', key);
            defEl.appendChild(upEl);
            this._definitionsList.appendChild(defEl);
        }
    }

    closeEdit() {
        this._defOverlay.style.display = 'none';
        let keys = Object.keys(this.currentDefs);
        this._definitionsList.innerHTML = "";
    }

    type(img, id, def) {
        let new_el = img.cloneNode(true);
        this._inputField.appendChild(new_el);
        this.currentMsg.push(id);

        this._definitionWrapper.style.display = 'flex';
        this._definition.innerHTML = def;
        console.log(def)
        console.log(this.currentMsg);
        const $this = this;
        setTimeout(function() {
            $this._inputField.scrollTo(0, $this._inputField.scrollHeight);
        }, 50)
        
    }

    unType(img, id) {
        this._definitionWrapper.style.display = 'none';
        this._definition.innerHTML = "";
        if(!this.currentMsg.length) return;

        this.currentMsg = this.currentMsg.slice(0,-1);
        this._inputField.removeChild(this._inputField.lastChild);
        console.log(this.currentMsg);
        this._inputField.scrollTo(0, this._inputField.scrollHeight);
    }

    sendMsg() {
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
        this._definitionWrapper.style.display = 'none';
        this._definition.innerHTML = "";
    }

    submitDefinition() {
        const $this = this;
        this.currentDefs[this.user] = document.querySelector('.defnitionField').value;
        const options = {
          method: 'POST',
          body: JSON.stringify({'def':JSON.stringify(this.currentDefs), 'keys':[this.currentId], 'user':this.user}),
          headers: {
            'content-type': 'application/json',
          },
        };

        fetch('/setDef', options).then((response) => {
            console.log('success')
            $this.closeEdit();
        })

        
    }

    msgReceived(msg) {
        console.log(msg);
        let keys = msg.msg.split(',');
        const msgEl = document.createElement('div');
        msgEl.classList.add('msg');
        const userEl = document.createElement('div');
        userEl.classList.add('user');
        userEl.innerHTML = msg.user+':';
        msgEl.appendChild(userEl);
        for(const key of keys) {
            if(!key) break;
            const k = document.createElement('div');
            k.classList.add('msg-key');
            const img = document.createElement('img');
            img.setAttribute('src', '/images/'+this.lookup[key].img);
            k.appendChild(img);
            msgEl.appendChild(k);
        }
        this._msgField.appendChild(msgEl);
        this._msgField.scrollTo(0, this._msgField.scrollHeight);
    }
}

new Site();

