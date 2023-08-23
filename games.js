const fs = require('fs-extra');
const fetch = require("node-fetch");
console.log("this is to be called once")
const stripTags = (text) => {
    const tags = /<[^>]*>/g;
    return text.replace(tags, "");
};
String.prototype.decodeHTML = function () {
    var map = { "gt": ">" /* , … */ };
    return this.replace(/&(#(?:x[0-9a-f]+|\d+)|[a-z]+);?/gi, function ($0, $1) {
        if ($1[0] === "#") {
            return String.fromCharCode($1[1].toLowerCase() === "x" ? parseInt($1.substr(2), 16) : parseInt($1.substr(1), 10));
        } else {
            return map.hasOwnProperty($1) ? map[$1] : $0;
        }
    });
};
const translate = require('@vitalets/google-translate-api').translate;
const createHttpProxyAgent = require('http-proxy-agent').HttpProxyAgent;

const agent = new createHttpProxyAgent('http://103.152.112.234:80');



//
exports.startGame = function (game, user, client) {
    let profil = fs.readJsonSync("users/" + user.id + "/profil.json");
    if (game == "hangman") {
        profil.actualGame = {
            "type": "hangman",
            "data": {
                "word": null,
                "realWord": null,
                "failed_attempts": 0,
                "language": null,
            }
        }
    } else if (game == "quizz") {
        profil.actualGame = {
            "type": "quizz",
            "data": {
                "questions": null,
                "answers_given": null,
                "interval_id": null,
            }
        }
    }
    fs.outputJsonSync("users/" + user.id + "/profil.json", profil);
}

exports.hangman = async function (msg, chat, client) {
    pics = ["  +-----+\n   |      |\n          |\n          |\n          |\n          |\n=====",

        "  +-----+\n   |      |\n  O     |\n          |\n          |\n          |\n=====",

        "  +-----+\n   |      |\n  O     |\n   |      |\n          |\n          |\n=====",

        "  +-----+\n   |      |\n  O     |\n  /|     |\n          |\n          |\n=====",

        "  +-----+\n   |      |\n  O     |\n  /|\\    |\n          |\n          |\n=====",

        "  +-----+\n   |      |\n  O     |\n  /|\\    |\n  /       |\n          |\n=====",

        "  +-----+\n   |      |\n  O     |\n  /|\\    |\n  / \\    |\n          |\n====="]

    let profil = fs.readJsonSync("users/" + msg.from + "/profil.json");
    if (profil.actualGame.data.word == null) {
        let word = "";
        let realWord = "";
        if (msg.body.startsWith("1")) {
            profil.actualGame.data.language = "anglais";
            let words = Object.keys(fs.readJsonSync("./_words/english-words.json"));
            while (word.length < 5) {
                word = words[(Math.random() * words.length).toFixed(0) - 1];
            }
            realWord = word;
        } else if (msg.body.startsWith("2")) {
            profil.actualGame.data.language = "français";
            let words = Object.keys(fs.readJsonSync("./_words/english-words.json"));
            while (word.length < 5 || word.includes('-')) {
                word = words[(Math.random() * words.length).toFixed(0) - 1];
            }
            realWord = word;
            word = word.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        } else {
            return;
        }


        let text = "*Mot :";
        let wordArray = [];
        let arr = word.split('');
        arr.forEach(letter => {
            wordArray.push({ "letter": letter, "found": false })
            text += " _ ";
        })
        profil.actualGame.data.word = wordArray;
        profil.actualGame.data.realWord = realWord;
        console.log("HANGMAN", profil.actualGame.data);
        fs.outputJsonSync("users/" + msg.from + "/profil.json", profil);
        text += "*\n\n" + pics[profil.actualGame.data.failed_attempts] + "\n\n*Proposez une lettre*\n_(les messages à plus d'une lettre seront ignoré)_\n\n0️⃣Annuler le pendu";
        msg.reply(text)
        return false;
    } else {
        let wordArray = [];
        let found = 0;
        let letters_found = 0;
        let text_dashes = "";
        profil.actualGame.data.word.forEach(letterarr => {
            if (letterarr.letter.toLowerCase().normalize("NFD")[0].includes(msg.body.toLowerCase())) {
                wordArray.push({ "letter": letterarr.letter, "found": true })
                found++;
                text_dashes += " " + letterarr.letter + " ";
                letters_found++;
            } else if (letterarr.found == true) {
                wordArray.push({ "letter": letterarr.letter, "found": true })
                text_dashes += " " + letterarr.letter + "";
                letters_found++;
            } else if (letterarr.found == false) {
                wordArray.push({ "letter": letterarr.letter, "found": false })
                text_dashes += " _";
            }
        })
        profil.actualGame.data.word = wordArray;
        let text1 = "";
        let text = "";
        if (found > 0) {
            text1 += "La lettre *" + msg.body + "* est correcte ✅";
            if (chat.isGroup) {
                let player_profil = fs.readJsonSync("users/" + msg.author + "/profil.json");
                player_profil.points += 10 * found;
                text1 += "\n\n@" + msg.author + " a reçu *" + (found * 10) + " points*";
                let mentions = [];
                const contact = await client.getContactById(msg.author);
                mentions.push(contact);
                chat.sendMessage(text1, { "mentions": mentions });
                fs.outputJsonSync("users/" + msg.author + "/profil.json", player_profil);
            } else {
                profil.points += 10 * found;
                text1 += "\n\nVous avait reçu *" + (found * 10) + " points*";
                msg.reply(text1);
            }
        } else {
            text1 += "La lettre *" + msg.body + "* est incorrecte ❌";
            profil.actualGame.data.failed_attempts += 1;
            msg.reply(text1);
        }
        text += "*Mot :" + text_dashes + "*\n\n";

        if (profil.actualGame.data.failed_attempts >= 6) {
            text += "\n\n🥲Vous avez échoué beaucoup trop de fois, *vous êtes mort!💀*\nLe mot était *" + profil.actualGame.data.realWord + "*\n\n" + pics[6] + "\n\n1️⃣Pour recommencer en " + profil.actualGame.data.language + "\n2️⃣Pour changer de langue\n0️⃣Annuler la partie"
            profil.actualGame.data.failed_attempts = 0;
            profil.actualGame.data.word = null;
            console.log("HANGMAN", profil.actualGame.data);
            fs.outputJsonSync("users/" + msg.from + "/profil.json", profil);
            msg.reply(text)
            return true;
        } else if (letters_found == wordArray.length) {
            text += "\n\n😀Vous avez trouvé le mot, *Vous êtes sauvé!✨*\nLe mot était *" + profil.actualGame.data.realWord + "*\n\n" + " 7_O_/\n" + " (/\n" + " /\/'\n" + " 7\n\n1️⃣Pour recommencer en " + profil.actualGame.data.language + "\n2️⃣Pour changer de langue\n0️⃣Annuler la partie"
            profil.points += 10;
            profil.actualGame.data.failed_attempts = 0;
            profil.actualGame.data.word = null;
            console.log("HANGMAN", profil.actualGame.data);
            fs.outputJsonSync("users/" + msg.from + "/profil.json", profil);
            msg.reply(text)
            return true;
        }
        console.log("HANGMAN", profil.actualGame.data);
        fs.outputJsonSync("users/" + msg.from + "/profil.json", profil);
        text += pics[profil.actualGame.data.failed_attempts];
        text += "\n\n*Proposez une lettre*\n_(les messages à plus d'une lettre seront ignoré)_\n\n0️⃣Annuler le pendu";
        msg.reply(text)
        return false;
    }
}


exports.quizz = async function (msg, client) {
    console.log("start by setting quiz")
    let isQuestionSet = false;
    let questions = [];
    let question = "";
    let answers = [];
    let shuffledAnswers;
    let isQuizRunning = true;
    let participants = [];
    let question_msg;
    let question_timer;
    let timer = 0;
    let mentions = [];
    let timeout;
    let timeout2;
    let timeout3;
    let interval_modify;

    client.on('message', async _msg => {
        if(_msg.from != msg.from)
        return;
        if ((_msg.body.toLowerCase().includes('!stop') && isQuizRunning) ||( _msg.body.toLowerCase().includes('0') && isQuizRunning)) {
            isQuizRunning = false;
            _msg.reply("*🛑 Le Quiz est arreté*")
            let _partProfil = fs.readJsonSync("users/" + _msg.from + "/profil.json");
            _partProfil.actualGame = null;
            fs.outputJsonSync("users/" + _msg.from + "/profil.json", _partProfil);
            clearTimeout(timeout)
            clearTimeout(timeout2)
            clearTimeout(timeout3)
            clearInterval(interval_modify)
            return
            //client.stopSending();
        }

        if (parseInt(_msg.body) > 9 || parseInt(_msg.body) < 0 || !parseInt(_msg.body) || _msg.body.length > 1 || !isQuizRunning) return;

        let sendQuestion = async () => {
            if (!isQuizRunning)
                return

            question = getRandomQuestion(questions);
            console.log('questions is', question)
            answers = [question.correct_answer, ...question.incorrect_answers];
            shuffledAnswers = answers.sort(() => Math.random() - 0.5);
            let txt = ``;
            for (let i = 0; i < shuffledAnswers.length; i++) {
                txt += `\n*${i + 1}. ${(shuffledAnswers[i]).decodeHTML()}*`;
            }
            question_msg = await client.sendMessage(_msg.from, (question.question).decodeHTML() + '\n' + txt + '\n\n0️⃣Arreter le quiz');
            let chat = await question_msg.getChat();
            if (chat.isGroup) {
                question_msg.reply("6️⃣0️⃣vous avez 60 secondes restantes");
                timeout = setTimeout(async () => {
                    console.log('WAITED responds send')
                    chat.sendMessage('*⌛Temps écoulé !*\n\n La bonne réponse était : *' + question.correct_answer + '*\n\nParticipants: \n' + (participants.length > 0 ? participants.map(part => `@${part.name.split('@')[0]} --> ${part.correct} ` + (part.correct == '✅' ? '(+30 points)' : '(+0 points)')).join("\n") : "*Personne*") + (isQuizRunning ? '\n\nQuestion suivante dans 10 secondes...' : '\n\n🥲Déjà fini?'), { "mentions": mentions });
                    participants.map((part) => {
                        let _partProfil = fs.readJsonSync("users/" + part.name + "/profil.json");
                        _partProfil.points += 30;
                        fs.outputJsonSync("users/" + part.name + "/profil.json", _partProfil);
                    })
                    participants = [];
                    if (isQuizRunning) {
                        setTimeout(() => { sendQuestion() }, 10000);
                    }
                }, 60000);
                timeout2 = setTimeout(() => {
                    if (!isQuizRunning)
                        return
                    console.log('WAITED 1s responds send')
                    question_msg.reply("1️⃣0️⃣ vous avez 10 secondes restantes");

                }, 50000);
                timeout3 = setTimeout(() => {
                    if (!isQuizRunning)
                        return
                    console.log('WAITED 1s responds send')
                    question_msg.reply("3️⃣0️⃣ vous avez 30 secondes restantes");

                }, 30000);
            }
        }

        if (!isQuestionSet) {
            let cats = _msg.body.split(',')
            cats.forEach(cat => {
                if (cat.includes("1")) {
                    questions = questions.concat(fs.readJsonSync("_Questions/math_questions.json"))
                } else if (cat.includes("2")) {
                    questions = questions.concat(fs.readJsonSync("_Questions/gk_questions_en.json"))
                } else if (cat.includes("3")) {

                } else if (cat.includes("4")) {

                }
            })
            _msg.reply('*Le quiz peut commencer!*\nVous pouvez tout arreter en envoyant *!stop* ou *0* à tout moment')
            sendQuestion()
            isQuestionSet = true;
        } else {

            if (_msg.body.toLowerCase().includes('!stop') && isQuizRunning) {
                isQuizRunning = false;
                _msg.reply("*🛑 Le Quiz est arreté*")
                clearTimeout(timeout)
                clearTimeout(timeout2)
                clearTimeout(timeout3)
                clearInterval(interval_modify)
                return
                //client.stopSending();
            }

            if (!isQuizRunning) {
                //client.sendMessage('Quiz stopped!');
                return;
            }

            if (_msg.body.startsWith('!') || _msg.body.length > 1) {
                return;
            }

            const answerIndex = parseInt(_msg.body) - 1;
            if (answerIndex < 0 || answerIndex >= shuffledAnswers.length) {
                _msg.reply("Envoyez un chiffre qui correspont à une option")
                return;
            }
            let chat = await question_msg.getChat();
            let participated = null;
            participants.forEach((part, index) => {
                if (part.name == (_msg.author ? _msg.author : _msg.from))
                    participated = index;
            })
            if (participated != null) {
                participants[participated].answer = _msg.body;
                participants[participated].correct = (shuffledAnswers[answerIndex] === question.correct_answer) ? '✅' : '❌';
            } else {
                participants.push({ "name": (_msg.author ? _msg.author : _msg.from), "answer": _msg.body, "correct": shuffledAnswers[answerIndex] === question.correct_answer ? '✅' : '❌' });
            }

            if (chat.isGroup) {
                const contact = await client.getContactById((msg.author));
                mentions.push(contact);
                chat.sendMessage('*Réponse(s) donnée(s):* \n\n' + participants.map(part => `@${part.name.split('@')[0]}  -->  *${part.answer}*`).join("\n"), { "mentions": mentions });
            } else {
                chat.sendMessage('La bonne réponse était : *' + question.correct_answer + '*\n\nParticipants: \n' + (participants[0].correct == '✅' ? 'Vous avez trouvé✅ (+30 points)' : 'Vous n\'avez pas trouvé❌ (+0 points)') + (isQuizRunning ? '\n\nQuestion suivante dans 3 secondes...' : '\n\n🥲Déjà fini?'), { "mentions": mentions });
                participants.map((part) => {
                    let _partProfil = fs.readJsonSync("users/" + part.name + "/profil.json");
                    _partProfil.points += 30;
                    fs.outputJsonSync("users/" + part.name + "/profil.json", _partProfil);
                })
                participants = [];
                if (isQuizRunning) {
                    setTimeout(() => { sendQuestion() }, 3000);
                }
            }

        }
    });

}

function getRandomQuestion(questions) {
    return questions[Math.floor(Math.random() * questions.length)];
}

exports.blagueen = function (msg) {
    let r = Math.floor(Math.random() * 4)
    if (r == 0) {
        yoMama(msg)
    } else {
        dadjokes(msg)
    }
}
exports.blaguefr = function (msg) {
    /*let r = Math.floor(Math.random() * 4)
    if(r == 0){
        blablagues(msg)
    }else{
        blablagues(msg)
    }*/

    let blagues = []
    blagues = blagues.concat(fs.readJsonSync("_jokes/1001_medecin.json"))
    blagues = blagues.concat(fs.readJsonSync("_jokes/1001_sexual.json"))
    let random_blague = Math.floor(Math.random() * blagues.length)
    msg.reply(blagues[random_blague].replaceAll('\n', '\n\n').replace('\n\n \n\n', ''))
}

let yoMama = function (msg) {
    let jokes = fs.readJsonSync("_jokes/yo_mama.json");
    let intro = ["You know what? *", "Nigga hear me out, *", "Let me tell you this, *", "Maybe you don't know but *"]
    let r = (Math.random() * jokes.length).toFixed(0);
    let r2 = (Math.random() * intro.length).toFixed(0);
    if (r < 0) r = 0;
    if (r2 < 0) r2 = 0;
    if (r2 >= intro.length) r2 = intro.length - 1;
    if (r >= jokes.length) r2 = jokes.length - 1;
    msg.reply(intro[r2] + jokes[r] + "*");
}


let dadjokes = async function (msg) {
    try {
        const response = await fetch('https://icanhazdadjoke.com/slack');

        if (!response.ok) {
            throw new Error(`Error! status: ${response.status}`);
        }

        const result = await response.json();
        msg.reply("*" + result.attachments[0].text + "*");
    } catch (err) {
        console.log(err);
    }
}

let blablagues = async function (msg) {
    try {
        const response = await fetch('https://api.blablagues.net/?rub=blagues');

        if (!response.ok) {
            throw new Error(`Error! status: ${response.status}`);
        }


        const result = await response.json();

        let text = "*" + result.data.content.text_head + "*\n" +
            (result.data.content.text.length > 0 ? result.data.content.text : result.data.content.text_hidden) +
            "\n\n" + result.data.like + " 👍   " + result.data.unlike + " 👎";

        msg.reply(text);

        let blagues = [];
        if (fs.pathExistsSync("_jokes/blagues.json")) {
            blagues = fs.readJsonSync("_jokes/blagues.json");
        }

        blagues.push(result)
        fs.outputJsonSync("_jokes/blagues.json", blagues);
    } catch (err) {
        console.log(err);
    }
}

exports.citations = async function (msg) {
    try {
        const response = await fetch('https://api.adviceslip.com/advice');
        if (!response.ok) {
            throw new Error(`Error! status: ${response.status}`);
        }
        const result = await response.json();
        const translated = await translate(result.slip.advice, {
            to: 'fr',
            fetchOptions: { agent },
          });

        let text = "Une citation pour vous:\n*⟪ " + translated.text + "⟫*\n                         _-Ange_";
        let chat = await msg.getChat();
        chat.sendMessage(text)
    } catch (err) {
        console.log(err);
    }
}