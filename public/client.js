class Site {
    constructor() {

        this.keys;
        this.lookup = {};
        this.definitions = {}
        this.popular;
        this.new;
        this.criteria;

        this.tagArrays;

        this.sortedArrays;


        this.ui();
        this.sio;
        this.initSockets();
        this.fetchData()
        this.fetchCriteria();
        this.fetchStyle();
       
        
        this.user = "Anon"
        this.username = "Anon"
        this.currentMsg = [];
        this.currentDefs;
        this.currentId;

        this.bindEvents();
    }

    ui() {
        this._keyboard = document.querySelector('.keyboard .keyboard-inner');
        this._popularKeyboard = document.querySelector('.popular-keyboard .keyboard-inner');
        this._newestKeyboard = document.querySelector('.newest-keyboard .keyboard-inner');
        this._archiveKeyboard = document.querySelector('.archive-keyboard .keyboard-inner');
        this._inputField = document.querySelector('.input-field');
        this._sendBtn = document.querySelector('.send');
        this._backBtn = document.querySelector('.backspace');
        this._msgField = document.querySelector('.message-list');
        this._usernameSubmit = document.querySelector('.usernameSubmit');
        this._username = document.querySelector('.username');
        this._email = document.querySelector('.email');
        this._overlay = document.querySelector('.overlay');
        this._defOverlay = document.querySelector('.def-overlay');
        this._definition = document.querySelector('.definition');
        this._definitionWrapper = document.querySelector('.def-inner-content');
        this._definitionsList = document.querySelector('.definitions-list');
        this._uploadOverlay = document.querySelector('.upload-overlay');
        this._editBtn = document.querySelector('.edit');
        this._critList = document.querySelector('.criteria-list');
        this._critField = document.querySelector('.critField');
        this._critOverlay = document.querySelector('.crit-overlay');

        this._styleList = document.querySelector('.style-list');
        this._styleField = document.querySelector('.styleField');
        this._styleOverlay = document.querySelector('.style-overlay');
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

    popularSortCrit(a,b) {
        return b[1] - a[1];
    }

    fetchData() {
        fetch('/fetchKeys')
        .then(data => {
            return data.json();
        })
        .then(keys => {
            keys.shift();


            let all = keys.slice();
            all.sort(this.popularSort);

            this.tagArrays = all.slice(0,121);
            this.sortedArrays = [this.tagArrays.shift()];


            this.archive = all.slice(121,all.length);
            // this.archive = all.slice(0,121);
            

            while (this.tagArrays.length > 0) {
                let maxCommonElements = -1;
                let nextIndex = -1;

                // Find the array with the most tags in common with the last sorted array
                for (let i = 0; i < this.tagArrays.length; i++) {
                    let numCommonElements = this.commonElements(JSON.parse(this.sortedArrays[this.sortedArrays.length - 1][9]), JSON.parse(this.tagArrays[i][9]));
                    if (numCommonElements > maxCommonElements) {
                        maxCommonElements = numCommonElements;
                        nextIndex = i;
                    }
                }

                this.sortedArrays.push(this.tagArrays.splice(nextIndex, 1)[0]);
            }

            // this.keys = keys;
            this.keys = this.sortedArrays.slice(0,121);
            for(let key=0; key<keys.length; key++) {
                this.lookup[keys[key][3]] = {img: keys[key][0], row:key, score:keys[key][4]};
                this.definitions[keys[key][3]] = {}
                let defJson = JSON.parse(keys[key][2]);
                let scoreJson = JSON.parse(keys[key][6]);
                for(var i=0; i<Object.keys(defJson).length; i++) {
                    let name = Object.keys(defJson)[i];
                    this.definitions[keys[key][3]][name] = {
                        text: defJson[name],
                        score: scoreJson[name] ? scoreJson[name] : 0
                    }
                }
            }
            let temp = keys.slice();
            this.new = temp.reverse();
            this.new = this.new.slice(0,33); // get 11 newest;
            this.popular = keys.slice();
            this.popular.sort(this.popularSort);
            this.popular = this.popular.slice(0,33); // get top 11;
            this.createKeyboard(this.popular, this._popularKeyboard);
            this.createKeyboard(this.new, this._newestKeyboard);
            this.createKeyboard(this.keys, this._keyboard);
            this.createKeyboard(this.archive, this._archiveKeyboard);
            this.fetchHistory();
        });
    }


    fetchCriteria() {
        fetch('/fetchCriteria')
        .then(data => {
            return data.json();
        })
        .then(criteria => {
            console.log(criteria)
            criteria.shift();
            this.criteria = criteria.slice();
            criteria.sort(this.popularSortCrit);
            // this.criteria = criteria;
            // console.log(this.criteria)
            this._critList.innerHTML += '<div style="background:#f0f0f0; margin-top:10px; padding:10px; margin-bottom:5px;"><h5>Fluid Content Criteria</h5><p style="margin-bottom:0"><b>top 10 upvoted</b></p></div>';
            this.populateCriteria(criteria.slice(0,10));
            this._critList.innerHTML += '<div style="background:#f0f0f0; margin-top:10px; padding:10px; margin-bottom:5px;"><h5>Archive / New</h5><p style="margin-bottom:0"><b>Criteria other than the top 10 upvoted - check to have your say by voting on new and old criteria</b></p></div>';
            this.populateCriteria(criteria.slice(10,criteria.length));
        });
    }

    fetchStyle() {
        fetch('/fetchStyle')
        .then(data => {
            return data.json();
        })
        .then(style => {
            console.log(style)
            style.shift();
            this.style = style.slice();
            style.sort(this.popularSortCrit);
            // this.style = style;
            // console.log(this.style)
            this._styleList.innerHTML += '<div style="background:#f0f0f0; margin-top:10px; padding:10px; margin-bottom:5px;"><h5>Fluid Style Criteria</h5><p style="margin-bottom:0"><b>top 10 upvoted</b></p></div>';
            this.populateStyle(style.slice(0,10));
            this._styleList.innerHTML += '<div style="background:#f0f0f0; margin-top:10px; padding:10px; margin-bottom:5px;"><h5>Archive / New</h5><p style="margin-bottom:0"><b>Criteria other than the top 10 upvoted - check to have your say by voting on new and old criteria</b></p></div>';
            this.populateStyle(style.slice(10,style.length));
        });
    }

    fetchHistory() {
        fetch('/fetchHistory')
        .then(data => {
            return data.json();
        })
        .then(history => {
            console.log(history);
            history.reverse();
            for(let i=0; i<history.length; i++) {
                let msg = {}
                msg.msg = history[i][0]
                msg.user = history[i][1];
                console.log(msg.msg)
                this.msgReceived(msg);
            }
        });
    }

    populateCriteria(crits) {
        for(let c of crits) {
            const critEl = document.createElement('div');
            critEl.classList.add('crit-item');
            critEl.setAttribute('data-id', c[2]);
            let content = c[0].replace(/\n/g, '<br>');

            critEl.innerHTML = content;

            const upEl = document.createElement('div');
            upEl.classList.add('crit-item-up');
            upEl.innerHTML = '<div class="vote-icon"><a href="#" class="upvote"><img src="assets/upvote.svg"></a></div><div class="score">'+c[1]+'</div><div class="vote-icon"><a href="#" class="downvote"><img src="assets/downvote.svg"></a></div>';
            upEl.setAttribute('data-id', c[2]);
            critEl.prepend(upEl);
            this._critList.appendChild(critEl);
        }
    }

    populateStyle(styles) {
        for(let s of styles) {
            const styleEl = document.createElement('div');
            styleEl.classList.add('style-item');
            styleEl.setAttribute('data-id', s[2]);
            let content = s[0].replace(/\n/g, '<br>');

            styleEl.innerHTML = content;

            const upEl = document.createElement('div');
            upEl.classList.add('style-item-up');
            upEl.innerHTML = '<div class="vote-icon"><a href="#" class="upvote"><img src="assets/upvote.svg"></a></div><div class="score">'+s[1]+'</div><div class="vote-icon"><a href="#" class="downvote"><img src="assets/downvote.svg"></a></div>';
            upEl.setAttribute('data-id', s[2]);
            styleEl.prepend(upEl);
            this._styleList.appendChild(styleEl);
        }
    }
    

    createKeyboard(keys, container) {
        console.log(keys, keys.length);
        for(let key=0; key<keys.length; key++) {
            const k = document.createElement('div');
            k.classList.add('key');
            k.setAttribute('data-title', keys[key][1]); // Set the title attribute for the key
            let def = null
            let score = 0;
            // if(keys[key][2]) {
            //     def = JSON.stringify(JSON.parse(keys[key][2]));
            // }
           
            for(var i=0; i<Object.keys(this.definitions[keys[key][3]]).length; i++) {
                let name = Object.keys(this.definitions[keys[key][3]])[i];
                
                if(this.definitions[keys[key][3]][name].score > score) {
                    def = this.definitions[keys[key][3]][name].text;
                    score = this.definitions[keys[key][3]][name].score;
                }
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
        this._username.addEventListener("input", this.checkLogin.bind(this), true);
        this._email.addEventListener("input", this.checkLogin.bind(this), true);
        // New GPT addition GPTITERATION1EDIT2 (edit 2 is before edit 1, later down)
        // just calling new method "bindHoverEvents" within existing bindEvents method
        this.bindHoverEvents();
    }

    clicked(e) {
        const $this = this;
        if(e.target.closest(".key")) {
            e.stopPropagation();
            if(document.querySelector(".key.highlight")) document.querySelector(".key.highlight").classList.remove('highlight');
            const el = e.target.closest(".key");
            const id = el.getAttribute('data-id');
            const img = el.querySelector('img');
            const def = el.getAttribute('data-definition');
            e.target.closest(".key").classList.add('highlight');
            this.currentId = id;
            this.type(img, id, def)
        } else if(e.target.closest(".send")) {
            e.stopPropagation();
            this.sendMsg();
            if(document.querySelector(".key.highlight")) document.querySelector(".key.highlight").classList.remove('highlight');
        } else if(e.target.closest(".backspace")) {
            e.stopPropagation();
            this.unType();
            if(document.querySelector(".key.highlight")) document.querySelector(".key.highlight").classList.remove('highlight');
        } else if(e.target.closest(".usernameSubmit")) {
            e.stopPropagation();
            this.closeModal();
        } else if(e.target.closest(".edit")) {
            e.stopPropagation();
            this.openEdit();
        } else if(e.target.closest(".definitionSubmit")) {
            e.stopPropagation();
            let newDefText = document.querySelector('.defnitionField').value;
            if (newDefText == "") return;
            let newDef = {score:0, text:newDefText}
            this.definitions[this.currentId][this.user] = newDef;
            const defEl = document.createElement('div');
            defEl.classList.add('def-item');
            defEl.setAttribute('data-key', this.user);
            defEl.innerHTML = newDefText;
            this._definitionsList.appendChild(defEl);
            setTimeout(function() {
                $this._definitionsList.scrollTo(0, $this._definitionsList.scrollHeight);
            }, 50)
            document.querySelector('.defnitionField').value = "";
            this.submitDefinition();
        } else if(e.target.closest('.def-item-up .upvote')) {
            e.stopPropagation();
            
            const key = e.target.closest('.def-item-up').getAttribute('data-key');
            let score = (parseInt(this.definitions[this.currentId][key].score) + 1);
            e.target.closest('.def-item-up').innerHTML = '<div class="vote-icon"></div><div class="score">'+score+'</div><div class="vote-icon"></div>';
            
            this.upvote(key);
        } else if(e.target.closest('.def-item-up .downvote')) {
            e.stopPropagation();
            
            const key = e.target.closest('.def-item-up').getAttribute('data-key');
            let score = (parseInt(this.definitions[this.currentId][key].score) - 1) < 0 ? 0 : parseInt(this.definitions[this.currentId][key].score) - 1;
            e.target.closest('.def-item-up').innerHTML = '<div class="vote-icon"></div><div class="score">'+score+'</div><div class="vote-icon"></div>';
            
            this.downvote(key);
        } else if(e.target.closest('.def-overlay .close')) {
            e.stopPropagation();
            this.closeEdit();
        } else if(e.target.closest('.upload-overlay .close-upload')) {
            e.stopPropagation();
            this._uploadOverlay.style.display = 'none';
        } else if(e.target.closest('.upload-btn')) {
            this._uploadOverlay.style.display = 'flex';
        } else if(e.target.closest('.clear')) {
            this.clearAll();
            if(document.querySelector(".key.highlight")) document.querySelector(".key.highlight").classList.remove('highlight');
        } else if(e.target.closest('.crit-item-up .upvote')) {
            e.stopPropagation();
            
            const id = e.target.closest('.crit-item-up').getAttribute('data-id');
            // console.log(this.criteria);
            // console.log(id)
            // console.log(this.criteria[id]);

            let crit = this.criteria.find(item => item[2] == id)

            // console.log(crit);

            let score = (parseInt(crit[1]) + 1);
            crit[1] = score;
            e.target.closest('.crit-item-up').innerHTML = '<div class="vote-icon"></div><div class="score">'+score+'</div><div class="vote-icon"></div>';
            // console.log(this.criteria)
            this.upvoteCrit(id);
        } else if(e.target.closest('.crit-item-up .downvote')) {
            e.stopPropagation();
            
            const id = e.target.closest('.crit-item-up').getAttribute('data-id');
            let crit = this.criteria.find(item => item[2] == id)
            let score = (parseInt(crit[1]) - 1) < 0 ? 0 : parseInt(crit[1]) - 1;
            crit[1] = score;
            // console.log(this.criteria)
            e.target.closest('.crit-item-up').innerHTML = '<div class="vote-icon"></div><div class="score">'+score+'</div><div class="vote-icon"></div>';
            
            this.downvoteCrit(id);
        } else if(e.target.closest('.critSubmit')) {
            this.addCrit();
        } else if(e.target.closest('.upload-crit-btn')) {
            this._critOverlay.style.display = 'flex'
        } else if(e.target.closest('.crit-overlay .close')) {
            this._critOverlay.style.display = 'none'
        } else if(e.target.closest('.upload-style-btn')) {
            this._styleOverlay.style.display = 'flex'
        } else if(e.target.closest('.style-overlay .close')) {
            this._styleOverlay.style.display = 'none'
        } else if(e.target.closest('.style-item-up .upvote')) {
            e.stopPropagation();
            const id = e.target.closest('.style-item-up').getAttribute('data-id');
            let style = this.style.find(item => item[2] == id)
            let score = (parseInt(style[1]) + 1);
            style[1] = score;
            e.target.closest('.style-item-up').innerHTML = '<div class="vote-icon"></div><div class="score">'+score+'</div><div class="vote-icon"></div>';
            this.upvoteStyle(id);
        } else if(e.target.closest('.style-item-up .downvote')) {
            e.stopPropagation();
            const id = e.target.closest('.style-item-up').getAttribute('data-id');
            let style = this.style.find(item => item[2] == id)
            let score = (parseInt(style[1]) - 1) < 0 ? 0 : parseInt(style[1]) - 1;
            style[1] = score;
            e.target.closest('.style-item-up').innerHTML = '<div class="vote-icon"></div><div class="score">'+score+'</div><div class="vote-icon"></div>';
            this.downvoteStyle(id);
        }  else if(e.target.closest('.styleSubmit')) {
            this.addStyle();
        }
    }

    checkLogin() {
        if(this._email.value == "" || this._username.value == "") {
            this._usernameSubmit.classList.add('disabled');
            return;
        }
        if(!this.validateEmail(this._email)) {
            this._usernameSubmit.classList.add('disabled');
            return;
        }

        this._usernameSubmit.classList.remove('disabled');
    }

    closeModal() {
        if(this._username.value == "" || this._email.value == "") return;

        if(!this.validateEmail(this._email)) return;

        this.user = this._email.value;
        this.username = this._username.value;
        // console.log(this.user, this.username);
        this._overlay.style.display = 'none';
    }



    validateEmail(input) {

      var validRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

      if (input.value.match(validRegex)) {

        return true;

      } else {
        return false;

      }

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
        this.definitions[this.currentId][key].score++;
        let def = null
        let score = 0;
        for(var i=0; i<Object.keys(this.definitions[this.currentId]).length; i++) {
            let name = Object.keys(this.definitions[this.currentId])[i];
            if(this.definitions[this.currentId][name].score > score) {
                def = this.definitions[this.currentId][name].text;
                score = this.definitions[this.currentId][name].score;
                // console.log(score);
            }
        }
        if(document.querySelector('.popular-keyboard .key[data-id="'+this.currentId+'"')) {
            document.querySelector('.popular-keyboard .key[data-id="'+this.currentId+'"').setAttribute('data-definition', def);
        }
        if(document.querySelector('.newest-keyboard .key[data-id="'+this.currentId+'"')) {
            document.querySelector('.newest-keyboard .key[data-id="'+this.currentId+'"').setAttribute('data-definition', def);
        }
        document.querySelector('.keyboard .key[data-id="'+this.currentId+'"').setAttribute('data-definition', def);
        this._definition.innerHTML = def;
        fetch('/upvoteDef', options).then((response) => {
            console.log('success')
        })

    }

    downvote(key) {

        const $this = this;
        const options = {
          method: 'POST',
          body: JSON.stringify({'keys':[this.currentId], 'def':key}),
          headers: {
            'content-type': 'application/json',
          },
        };
        this.definitions[this.currentId][key].score = (this.definitions[this.currentId][key].score - 1) < 0 ? 0 : this.definitions[this.currentId][key].score - 1;
        let def = null
        let score = 0;
        for(var i=0; i<Object.keys(this.definitions[this.currentId]).length; i++) {
            let name = Object.keys(this.definitions[this.currentId])[i];
            if(this.definitions[this.currentId][name].score > score) {
                def = this.definitions[this.currentId][name].text;
                score = this.definitions[this.currentId][name].score;
                // console.log(score);
            }
        }
        if(document.querySelector('.popular-keyboard .key[data-id="'+this.currentId+'"')) {
            document.querySelector('.popular-keyboard .key[data-id="'+this.currentId+'"').setAttribute('data-definition', def);
        }
        if(document.querySelector('.newest-keyboard .key[data-id="'+this.currentId+'"')) {
            document.querySelector('.newest-keyboard .key[data-id="'+this.currentId+'"').setAttribute('data-definition', def);
        }
        document.querySelector('.keyboard .key[data-id="'+this.currentId+'"').setAttribute('data-definition', def);
        this._definition.innerHTML = def;
        fetch('/downvoteDef', options).then((response) => {
            console.log('success')
        })
        
    }

    upvoteCrit(key) {

        const $this = this;
        const options = {
          method: 'POST',
          body: JSON.stringify({'crit':[key]}),
          headers: {
            'content-type': 'application/json',
          },
        };
        
        fetch('/upvoteCrit', options).then((response) => {
            console.log('success')
        })

    }

    downvoteCrit(key) {

        const $this = this;
        const options = {
          method: 'POST',
          body: JSON.stringify({'crit':[key]}),
          headers: {
            'content-type': 'application/json',
          },
        };
        
        fetch('/downvoteCrit', options).then((response) => {
            console.log('success')
        })

    }

    upvoteStyle(key) {

        const $this = this;
        const options = {
          method: 'POST',
          body: JSON.stringify({'style':[key]}),
          headers: {
            'content-type': 'application/json',
          },
        };
        
        fetch('/upvoteStyle', options).then((response) => {
            console.log('success')
        })

    }

    downvoteStyle(key) {

        const $this = this;
        const options = {
          method: 'POST',
          body: JSON.stringify({'style':[key]}),
          headers: {
            'content-type': 'application/json',
          },
        };
        
        fetch('/downvoteStyle', options).then((response) => {
            console.log('success')
        })

    }

    addCrit() {

        const $this = this;
        const val = this._critField.value;
        if(val == "") return;
        this._critField.value = "";
        const options = {
          method: 'POST',
          body: JSON.stringify({'crit':[val, '0']}),
          headers: {
            'content-type': 'application/json',
          },
        };

        const critEl = document.createElement('div');
        critEl.classList.add('crit-item');
        critEl.innerHTML = val;

        this._critList.appendChild(critEl);

        setTimeout(function() {
            $this._critList.scrollTo(0, $this._critList.scrollHeight);
        }, 50)
        
        fetch('/addCrit', options).then((response) => {
            console.log('success')
        });

    }

    addStyle() {

        const $this = this;
        const val = this._styleField.value;
        if(val == "") return;
        this._styleField.value = "";
        const options = {
          method: 'POST',
          body: JSON.stringify({'style':[val, '0']}),
          headers: {
            'content-type': 'application/json',
          },
        };

        const styleEl = document.createElement('div');
        styleEl.classList.add('style-item');
        styleEl.innerHTML = val;

        this._styleList.appendChild(styleEl);

        setTimeout(function() {
            $this._styleList.scrollTo(0, $this._styleList.scrollHeight);
        }, 50)
        
        fetch('/addStyle', options).then((response) => {
            console.log('success')
        });

    }


    openEdit() {
        this._defOverlay.style.display = 'flex';
        let definitions = [];

        for(var i=0; i<Object.keys(this.definitions[this.currentId]).length; i++) {
            let name = Object.keys(this.definitions[this.currentId])[i];
            let score = this.definitions[this.currentId][name].score;
            let text = this.definitions[this.currentId][name].text;
            definitions.push({name, score, text});
        }

        definitions.sort(function (a, b) {
            return b.score - a.score
        });

        for(let d of definitions) {
            const defEl = document.createElement('div');
            defEl.classList.add('def-item');
            defEl.setAttribute('data-key', d.name);
            defEl.innerHTML = d.text;

            const upEl = document.createElement('div');
            upEl.classList.add('def-item-up');
            upEl.innerHTML = '<div class="vote-icon"><a href="#" class="upvote"><img src="assets/upvote.svg"></a></div><div class="score">'+d.score+'</div><div class="vote-icon"><a href="#" class="downvote"><img src="assets/downvote.svg"></a></div>';
            upEl.setAttribute('data-key', d.name);
            defEl.prepend(upEl);
            this._definitionsList.appendChild(defEl);
        }
    }

    closeEdit() {
        this._defOverlay.style.display = 'none';
        // let keys = Object.keys(this.currentDefs);
        this._definitionsList.innerHTML = "";
    }

    type(img, id, def) {
        let new_el = img.cloneNode(true);
        this._inputField.appendChild(new_el);
        this.currentMsg.push(id);

        this._definitionWrapper.style.display = 'flex';
        this._definition.innerHTML = def;
        this._editBtn.style.display = 'block';
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
        this._editBtn.style.display = 'none';
        if(!this.currentMsg.length) return;

        this.currentMsg = this.currentMsg.slice(0,-1);
        this._inputField.removeChild(this._inputField.lastChild);
        console.log(this.currentMsg);
        this._inputField.scrollTo(0, this._inputField.scrollHeight);
    }

    clearAll() {
        this._definitionWrapper.style.display = 'none';
        this._definition.innerHTML = "";
        this._editBtn.style.display = 'none';
        if(!this.currentMsg.length) return;

        this.currentMsg = [];
        this._inputField.innerHTML = "";
        this._inputField.scrollTo(0, 0);
    }

    sendMsg() {
        if(!this.currentMsg.length) return;
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

        this.sio.emit("chat message", {msg: this.currentMsg.join(), user:this.username});
        this.currentMsg = [];
        this._inputField.innerHTML = "";
        this._definitionWrapper.style.display = 'none';
        this._definition.innerHTML = "";
        this._editBtn.style.display = 'none';
    }

    submitDefinition() {
        const $this = this;
        // this.currentDefs[this.user] = document.querySelector('.defnitionField').value;
        let data = {}

        for(var i=0; i<Object.keys(this.definitions[this.currentId]).length; i++) {
            let name = Object.keys(this.definitions[this.currentId])[i];
            let text = this.definitions[this.currentId][name].text;
            data[name] = text;
        }


        const options = {
          method: 'POST',
          body: JSON.stringify({'def':JSON.stringify(data), 'keys':[this.currentId], 'user':this.user}),
          headers: {
            'content-type': 'application/json',
          },
        };

        fetch('/setDef', options).then((response) => {
            console.log('success')
            // $this.closeEdit();
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

    commonElements(array1, array2) {
        return array1.filter(element => array2.includes(element)).length;
    }

    // GPTITERATION1EDIT1

    // ... rest of your existing methods ...

    // Add this new method for hover event binding - added to the class "Site" (the whole big class)

    bindHoverEvents() {
        const keys = document.querySelectorAll('.key');
        keys.forEach(key => {
            key.addEventListener('mouseover', this.showDefinition.bind(this));
            key.addEventListener('mouseout', this.hideDefinition.bind(this));
        });
    }

    //method to show definitions, added to the class

    showDefinition(event) {
        const keyElement = event.target.closest('.key');
        const definition = keyElement.getAttribute('data-definition');
        keyElement.setAttribute('title', definition); // Simplest way using native tooltips
    }

    hideDefinition(event) {
        // This method can be left empty if you don't need any actions on mouseout
    }

    // ... rest of your existing methods ...


  
}

new Site();

