const qrcode = require('qrcode-terminal');
const fs = require('fs-extra');
const { Client, Buttons, LocalAuth, List } = require('whatsapp-web.js');
const client = new Client({
    authStrategy: new LocalAuth()
});
const Users = require("./users/users");
const games = require("./games");

let salutations = "Salut, je suis Ange🙂.\nQue veux-tu faire?"
let options = "\n\n*JEUX*\n" +
    "1️⃣ Jouer à un jeu" +
    "\n\n*BLAGUES*\n" +
    "2️⃣ En Français\n" +
    "3️⃣ En Anglais" +
    "\n\n*INFOS*\n" +
    "0️⃣ Qui suis-je?\n" +
    "\n_Envoie le chiffre de ton choix😉_";

let introduction_msg = salutations + options;

let choose_game_msg = "Quel jeu vas-tu choisir?🤔\n\n" +
    "1️⃣ Le pendu\n" +
    "2️⃣ Quizz\n\n" +
    "0️⃣ Annuler\n" +
    "\n_Envoie le chiffre de ton choix😉_";

let message_info = "Hey!😀\nMerci de t'intéresser à moi!\n\n" +
    "😎 Je m'appelle *Ange*, je sui un robot créé pour te divertir avec mes multiples jeux🎮, blagues🤣, etc...\n\n" +
    "*Propose des jeux à ajouter*\n" +
    "Si tu souhaites proposer un jeu, c'est très simple.\n" +
    "il te suffit d'écrire *!jeux* puis le nom du jeu \n(ex: '!Jeux sudoku')\n\n" +
    "je vais aller faire des recherches dessus et l'ajouter dès que possible!🙂\n\n" +
    "*Une contribution?😉*\n" +
    "Je suis constamment en dévéloppement, si tu souhaites me voir m'améliorer et m'ajouter des nouveaux jeux, tu peux contribuer via ce lien👇:\n" +
    "https://me.lygosapp.com/QMbb9EEV \n_2023@Eden-Entertainements_" + options;

client.on('message', async msg => {
    try {
        // console.log('MESSAGE RECEIVED \n FROM : ', msg.from, '\n TEXT :', msg.body);
        if (!msg.from.includes(".us"))
            return;
        let chat = await msg.getChat();
        const contact = await client.getContactById(msg.from);
        console.log(contact.pushname + "(" + (contact.name ? contact.name : contact.number) + ") : " + msg.body);
        let user = null;
        user = fs.pathExistsSync("users/" + msg.from + "/profil.json") ? fs.readJsonSync("users/" + msg.from + "/profil.json") : null;
        let author_user = (chat.isGroup && fs.pathExistsSync("users/" + msg.author + "/profil.json")) ? fs.readJsonSync("users/" + msg.author + "/profil.json") : (fs.pathExistsSync("users/" + msg.author + "/profil.json") ? fs.readJsonSync("users/" + msg.author + "/profil.json") : null);
        /* if (!chat.isGroup && fs.pathExistsSync("users/" + msg.from + "/profil.json")) {
            
         } else if (chat.isGroup && fs.pathExistsSync("users/" + msg.author + "/profil.json")) {
             user = fs.readJsonSync("users/" + msg.author + "/profil.json");
         }*/

        if (msg.from != "237676073549@c.us") {
            if (chat.isGroup) {
                if (author_user == null) {
                    let author_contact = await client.getContactById(msg.author);
                    Users.setUser(msg.author, {
                        "id": msg.author,
                        "name": "" + author_contact.pushname,
                        "isMultiplayer": false,
                        "points": 0,
                        "actualGame": null,
                        "lastSession": Date.now()
                    })
                }
            }
            if (user) {
                let _discussions = fs.readJSONSync("./users/" + user.id + "/discussion.json");
                let discussion;
                if (_discussions.length > 0) {
                    discussion = { ..._discussions[_discussions.length - 1] };
                } else {
                    discussion = { "from": user.id, "text": "", "isGame": false, "state": "idle" };
                }
                _discussions = [];

                if (user.lastSession < Date.now() - (60 * 60 * 1000)) {
                    user.lastSession = Date.now()
                    games.citations(msg)
                    fs.outputJsonSync("./users/" + user.id + "/profil.json", user);
                }

                if (msg.body.toLowerCase().includes('!info')) {
                    msg.reply("*Vos informations* :\n\n" +
                        "Nom : *" + author_user.name + "*\n" +
                        "Points : *" + author_user.points + " points*\n"
                    )
                } else if (msg.body.toLowerCase().includes('!groupinfo')) {
                    if (chat.isGroup) {
                        let mentions = [];
                        let txt = "";
                        console.log(chat.participants)
                        chat.participants.forEach(async part => {
                            let _contact = await client.getContactById(part.id._serialized)
                            mentions.push(_contact)
                            txt += "\n@" + _contact.number + " " + (part.isSuperAdmin ? "👑" : "");
                            if (fs.pathExistsSync("users/" + _contact.id._serialized + "/profil.json")) {
                                let _user = fs.readJsonSync("users/" + _contact.id._serialized + "/profil.json");
                                txt += " (" + _user.points + " points)"
                            }
                        })
                        chat.sendMessage("*Informations du groupe:*\n\n" +
                            "Nom : *" + chat.name + "*\n\n" +
                            "*Participants*\n" + txt, { "mentions": mentions }
                        )
                    } else {
                        msg.reply("Cette commande ne peut être appelé que dans un groupe!")
                    }

                } else if (msg.body.toLowerCase().includes('!stop')) {
                    user.actualGame = null;
                    fs.outputJsonSync("./users/" + user.id + "/profil.json", user);
                    console.log("game stopped")
                    msg.reply(introduction_msg)
                    _discussions.push({ "from": user.id, "text": msg.body, "isGame": false, "state": "choose game" })
                } else if (msg.body.toLowerCase().includes('!contribution')) {
                    chat.sendMessage(introduction_msg)
                    msg.reply("wow🥹,\nMerci infiniment d'avoir contribué!💞\n\nMaintenant nous sommes super-potes🫂\n*Je ne l'oublierai jamais!*")
                    _discussions.push({ "from": user.id, "text": msg.body, "isGame": false, "state": "choose game" })
                } else if (msg.body.toLowerCase().includes('!jeux')) {
                    chat.sendMessage(introduction_msg)
                    msg.reply("Daccord👍,\n*" + msg.body.slice(6) + "* a été pris en compte\nOn va travailler jour et nuit pour l'ajouter😉")
                    _discussions.push({ "from": user.id, "text": msg.body, "isGame": false, "state": "choose game" })
                } else if (msg.body === '!buttons') {
                    let button = new Buttons('Button body', [{ body: 'bt1' }, { body: 'bt2' }, { body: 'bt3' }], 'title', 'footer');
                    client.sendMessage(msg.from, button);
                } else if (msg.body === '!list') {
                    let sections = [{ title: 'sectionTitle', rows: [{ title: 'ListItem1', description: 'desc' }, { title: 'ListItem2' }] }];
                    let list = new List('List body', 'btnText', sections, 'Title', 'footer');
                    client.sendMessage(msg.from, list);
                }

                if (msg.body.length < 3)
                    if (user.actualGame != null) {
                        if (discussion.state == "hangman-lang") {
                            games.hangman(msg, chat, client)
                            if (msg.body.startsWith("0")) {
                                msg.reply(introduction_msg)
                                user.actualGame = null;
                                fs.outputJsonSync("./users/" + user.id + "/profil.json", user);
                                _discussions.push({ "from": user.id, "text": msg.body, "isGame": false, "state": "choose game" })
                            } else if (msg.body.startsWith("1") || msg.body.startsWith("2")) {
                                _discussions.push({ "from": user.id, "text": msg.body, "isGame": true, "state": "hangman-try" })
                            } else if (!msg.body.startsWith('!')) {
                                msg.reply("Vous allez commencer *le jeu du pendu*\nDans ce jeu, vous devez deviner le mot. Pour chaque mauvaise réponse, le corps du pendu apparait. Lorsqu'il est complet, vous avez perdu!\nChosissez la langue des mots:\n1️⃣Anglais \n0️⃣Annuler")
                                _discussions.push({ "from": user.id, "text": msg.body, "isGame": true, "state": "hangman-lang" })
                            }

                        } else if (discussion.state.includes("quizz")) {
                            if (msg.body.includes('0')) {
                                msg.reply(introduction_msg)
                                _discussions.push({ "from": user.id, "text": msg.body, "isGame": false, "state": "choose game" })
                            } else {
                                console.log("quizz continued")
                                _discussions.push({ "from": user.id, "text": msg.body, "isGame": true, "state": "quizz" })
                            }


                        } else if (discussion.state == "hangman-try") {
                            if (msg.body.startsWith("0") || msg.body.toLowerCase().includes("!stop")) {
                                user.actualGame = null;
                                fs.outputJsonSync("./users/" + user.id + "/profil.json", user);
                                msg.reply(introduction_msg)
                                _discussions.push({ "from": user.id, "text": msg.body, "isGame": false, "state": "choose game" })
                            } else {
                                let results = games.hangman(msg, chat, client)
                                if (results == true) {
                                    _discussions.push({ "from": user.id, "text": msg.body, "isGame": true, "state": "hangman-retry" })
                                } else {
                                    _discussions.push({ "from": user.id, "text": msg.body, "isGame": true, "state": "hangman-try" })
                                }
                            }
                        } else if (discussion.state == "hangman-retry") {
                            if (msg.body.startsWith("0")) {
                                user.actualGame = null;
                                fs.outputJsonSync("./users/" + user.id + "/profil.json", user);
                                msg.reply(introduction_msg)
                                _discussions.push({ "from": user.id, "text": msg.body, "isGame": false, "state": "choose game" })
                            } else if (msg.body.startsWith("2")) {
                                let profil = fs.readJsonSync("users/" + user.id + "/profil.json");
                                if (profil.actualGame.data.language == "anglais") {
                                    msg.body = "1️⃣"
                                } else if (profil.actualGame.data.language == "français") {
                                    msg.body = "2️⃣"
                                }
                                games.hangman(msg, chat, client)
                                _discussions.push({ "from": user.id, "text": msg.body, "isGame": true, "state": "hangman-try" })
                            } else if (msg.body.startsWith("1")) {
                                games.startGame("hangman", user, client)
                                msg.reply("Vous allez commencer *le jeu du pendu*\nDans ce jeu, vous devez deviner le mot. Pour chaque mauvaise réponse, le corps du pendu apparait. Lorsqu'il est complet, vous avez perdu!\nChosissez la langue des mots:\n1️⃣Anglais \n2️⃣Français(avec accents)\n\n0️⃣Annuler")
                                _discussions.push({ "from": user.id, "text": msg.body, "isGame": true, "state": "hangman-lang" })
                            } else if (!msg.body.startsWith('!')) {
                                msg.reply("Vous allez commencer *le jeu du pendu*\nDans ce jeu, vous devez deviner le mot. Pour chaque mauvaise réponse, le corps du pendu apparait. Lorsqu'il est complet, vous avez perdu!\nChosissez la langue des mots:\n1️⃣Anglais \n2️⃣Français(avec accents)\n\n0️⃣Annuler")
                                _discussions.push({ "from": user.id, "text": msg.body, "isGame": true, "state": "hangman-lang" })
                            }
                        } else {
                            /* msg.reply(choose_game_msg)
                             _discussions.push({ "from": user.id, "text": msg.body, "isGame": false, "state": "game choosen" })*/
                        }
                    } else {
                        if (discussion.state == "idle") {
                            msg.reply(introduction_msg)
                            _discussions.push({ "from": user.id, "text": msg.body, "isGame": false, "state": "choose game" })
                        } else if (discussion.state == "choose game") {
                            if (msg.body.startsWith("1")) {
                                msg.reply(choose_game_msg)
                                _discussions.push({ "from": user.id, "text": msg.body, "isGame": false, "state": "game choosen" })
                            } else if (msg.body.startsWith("2")) {
                                msg.reply(introduction_msg);
                                games.blaguefr(msg)
                                _discussions.push({ "from": user.id, "text": msg.body, "isGame": false, "state": "choose game" })
                            } else if (msg.body.startsWith("3")) {
                                msg.reply(introduction_msg);
                                games.blagueen(msg)
                                _discussions.push({ "from": user.id, "text": msg.body, "isGame": false, "state": "choose game" })
                            } else if (msg.body.startsWith("0")) {
                                msg.reply(message_info)
                                _discussions.push({ "from": user.id, "text": msg.body, "isGame": false, "state": "choose game" })
                            } else if (!msg.body.startsWith('!') && !chat.isGroup) {
                                msg.reply("veillez n'envoyer que le chiffre qui correspont à votre choix !");
                                msg.reply(introduction_msg)
                                _discussions.push({ "from": user.id, "text": msg.body, "isGame": false, "state": "choose game" })
                            }

                        } else if (discussion.state == "game choosen") {
                            if (msg.body.startsWith("1")) {
                                games.startGame("hangman", user, client)
                                msg.reply("Vous allez commencer *le jeu du pendu*\nDans ce jeu, vous devez deviner le mot. Pour chaque mauvaise réponse, le corps du pendu apparait. Lorsqu'il est complet, vous avez perdu!\nChosissez la langue des mots:\n1️⃣Anglais \n2️⃣Français(avec accents)\n\n0️⃣Annuler")
                                _discussions.push({ "from": user.id, "text": msg.body, "isGame": true, "state": "hangman-lang" })
                            } else if (msg.body.startsWith("2")) {
                                msg.reply("Vous allez commencer *le quizz*\nRépondez au questions en envoyant le chiffre qui correspont à la réponse.\n\nChoisissez la(les) catégories de questions que vous souhaitez voir.\nVous pouvez choisir plusieurs catégories en envoyant les chiffres qui correspondent séparés par des virgules (ex: '1,2' pour mélanger les questions de Mathématique et de culture générale du Cameroun)\n\n*Français*\n*Prochainement...*\n\n*Anglais*\n1️⃣Mathematiques\n2️⃣Culture Générale du Cameroun\n\n0️⃣Annuler")
                                games.startGame("quizz", user, client)
                                games.quizz(msg, client)
                                _discussions.push({ "from": user.id, "text": msg.body, "isGame": true, "state": "quizz" })
                            } else if (msg.body.startsWith("0")) {
                                msg.reply(introduction_msg)
                                _discussions.push({ "from": user.id, "text": msg.body, "isGame": false, "state": "choose game" })
                            } else if (!msg.body.startsWith('!') && !chat.isGroup) {
                                msg.reply("veillez n'envoyer que le chiffre qui correspont à votre choix !");
                                msg.reply(choose_game_msg)
                                _discussions.push({ "from": user.id, "text": msg.body, "isGame": false, "state": "game choosen" })
                            }
                        } else {
                            msg.reply(introduction_msg)
                            _discussions.push({ "from": user.id, "text": msg.body, "isGame": false, "state": "choose game" })

                        }
                    }
                if (_discussions.length == 0)
                    _discussions.push({ "from": user.id, "text": msg.body, "isGame": discussion.isGame, "state": discussion.state })
                fs.outputJsonSync("./users/" + user.id + "/discussion.json", _discussions);
            } else {
                Users.setUser(msg.from, {
                    "id": msg.from,
                    "name": contact.pushname,
                    "isMultiplayer": false,
                    "points": 0,
                    "actualGame": null,
                    "lastSession": Date.now()
                })
                if (chat.isGroup && author_user == null) {
                    let author_contact = await client.getContactById(msg.author);
                    Users.setUser(msg.author, {
                        "id": msg.author,
                        "name": author_contact.pushname,
                        "isMultiplayer": false,
                        "points": 0,
                        "actualGame": null,
                        "lastSession": Date.now()
                    })
                }
                let arr = [];
                arr.push({ "from": msg.from, "text": msg.body, "isGame": false, "state": "choose game" })
                fs.outputJsonSync("./users/" + ((chat.isGroup) ? msg.author : msg.from) + "/discussion.json", arr);
                msg.reply(introduction_msg)
            }


        }

    } catch (error) {
        console.log(error)
        client.sendMessage("237676073559@c.us", "ERROR\n\nMSG_FROM : " + msg.from + "\nMSG : " + msg.body + "\nERROR: \n" + error.toString()); /** */
    }
});

client.on('group_join', async (notification) => {
    ///// WHEN PLAYER ENTERS WE CHECK HIS USER AND ADD HIM IF EMPTY
    /*const users = fs.readJsonSync("users/users.json");
    users.push({
        "id" : sender_id,
        "isInGroup" : false,
        "isPlayer" : false,
        "community_id" : ""
    })
    fs.outputJsonSync("users/users.json", users);*/
});

client.on('message_create', async (msg) => {
    // User has left or been kicked from the group.
/*
    if (msg.fromMe) {
        let contactee = await client.getContactById(msg.to)
        console.log("BOT to " + contactee.pushname + "(" + (contactee.name ? contactee.name : contactee.number) + ") : " + msg.body)
    }
*/
});

client.on('group_update', (notification) => {
    // Group picture, subject or description has been updated.
    console.log('update', notification);
});

client.on('change_state', state => {
    console.log('CHANGE STATE', state);
});

client.on('disconnected', (reason) => {
    console.log('Client was logged out', reason);
});

client.on('qr', qr => {
    console.log(qr, "\n");
    qrcode.generate(qr, {
        small: true
    });
});

client.on('authenticated', () => {
    console.log('AUTHENTICATED');
});

client.on('auth_failure', msg => {
    // Fired if session restore was unsuccessful
    console.error('AUTHENTICATION FAILURE', msg);
});

client.on('loading_screen', (percent, message) => {
    console.log('LOADING  --- ', percent, message);
});

client.on('ready', () => {
    console.log('READY');
    let users = fs.readJsonSync("users/users.json");
    /*
        users.forEach(_user => {
            fs.outputJsonSync("./users/" + _user.id + "/discussion.json", [{ "from": _user.id, "text": "hello", "isGame": false, "state": "idle" }]);
            let _profil = fs.readJsonSync("users/" + _user.id + "/profil.json");
            _profil.actualGame = null;
            fs.outputJsonSync("./users/" + _user.id + "/profil.json", _profil);
        })*/
});

client.initialize();
