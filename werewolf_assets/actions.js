const fs = require('fs-extra');
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



exports.suivre = async function (msg, client, _callback) {

    let isAction = true;
    let chat = await msg.getChat()
    if (chat.isGroup) return

    let profil = fs.readJsonSync("../users/" + msg.from + "/profil.json");
    let group_profil = fs.readJsonSync("../users/" + profil.actualGame.groupId + "/profil.json");
    let Allplayers = group_profil.actualGame.playerList;
    let player_List;

    Allplayers.forEach(_player => {
        if (_player.isAlive)
            player_List.push(_player)
    })
    let actionee_profil = null;
    msg.reply("Voici une liste de tout les joueurs.\nEnvoyez le chiffre qui correspond au joueur que vous souhaitez suivre:" + player_List.map((_player, index) => '\n*' + (index + 1) + '. ' + _player.name + '* (' + _player.id.split('@')[0] + ')') + '\n\n0️⃣ Pour ne plus suivre')

    let available_Actions = [];

    client.on('message', _msg => {
        if (_msg.body.length > 1 || parseInt(_msg.body) == NaN || _msg.from != msg.from || !isAction) return
        if (_msg.body.startsWith('0')) {
            isAction = false;
            _msg.reply('*Action Annulé !*')
        } else if (!actionee_profil) {
            if (parseInt(_msg.body) >= player_List.length || parseInt(_msg.body) <= 0) {
                _msg.reply('Ce chiffre n\'est pas dans la liste\nVeillez entrer un chiffre qui correspond à un joueur')
                return
            }
            actionee_profil = fs.readJsonSync("../users/" + player_List[parseInt(_msg.body) - 1].id + "/profil.json");
            let response = "Après avoir suivi *" + player_List[parseInt(_msg.body) - 1].name + "*, Voici ce que vous avez découvert :\n";
            response += "\n👉ça fortune àvoisine les *" + (Math.ceil(actionee_profil.actualGame.money / 1000) * 1000) + " Frs*";
            let isDeath = false;
            actionee_profil.actualGame.roles.forEach((role, index) => {
                if (index > 0) return
                if (role.name.toLowerCase().includes('werewolf') && Math.floor(Math.random() * 10) > 4 && !isDeath) {
                    let resp = ["\n👉 Il sembre très discrèt.", "\n👉 Il sort de chez le bouché, ça fait une sacrée quantité de viande!", "\n👉 Il est plutôt cool avec ces lunettes de soleil!"]
                    response += resp[Math.floor(Math.random() * resp.length)]
                    if (Math.floor(Math.random() * 10) > 6) {
                        isDeath = true;
                        response += "\nEn le suivant il tourne vers une petite ruelle.\nVous tournez vous aussi et ... oh!...\n*Vous êtes Mort💀*";
                    }
                } else if (role.name.toLowerCase().includes('vampire') && !isDeath) {
                    let resp = ["\n👉 Il n'est pas très difficile à suivre.\nÀ plus 40°C, il est le seul avec un pull à capuche", "\n👉 De toute la journée il n'est pas sorti de chez lui\nLe ciel s'asombri\nAaah! enfin il sort! suivons-le!", "\n👉 Il ne parle à personne, toujours avec un parapluie alors qu'il ne pleut pas, en même temps il fait très chaud!\n n'empêche, il est quand-même bizzare!"]
                    response += resp[Math.floor(Math.random() * resp.length)]
                    if (Math.floor(Math.random() * 10) > 6) {
                        isDeath = true;
                        response += "\nIl entre dans des toilettes publique et vous le suivez\n*Vous êtes Mort💀*";
                    }
                } else if (role.name.toLowerCase().includes('sorcier') && !isDeath) {
                    let resp = ["\n👉 Il n'est pas très difficile à suivre.\nC'est pas tout le monde qui marche avec des os comme collier", "\n👉 Il reste beaucoup chez lui, et il y a souvent des droles de lumières à l'intèriure", "\n👉 Je crois que je vais arreter de le suivre, la chaleur me donne des halucinations...\nJe vien de voir un chat bleu clair avec des yeux rouges sortir de ça maison😐"]
                    response += resp[Math.floor(Math.random() * resp.length)]
                    if (Math.floor(Math.random() * 10) > 7) {
                        isDeath = true;
                        response += "\nBon! je vais aller regarder derrière ça maison\nVous êtes soudainement fatigué\n*Vous êtes Mort💀*";
                    }
                } else if (role.name.toLowerCase().includes('Maire') && !isDeath) {
                    let resp = ["\n👉 Il est toujours entouré par des tons de personnes en costume cravate", "\n👉 C'est bizzare, pendant que je le suis on dirait qu'il y a des gens qui m'observent", "\n👉 Wow!!! c'est ça ça maison?😐\nElle est énorme!"]
                    response += resp[Math.floor(Math.random() * resp.length)]
                } else if (!isDeath) {
                    let resp = ["\n👉 Bon bah, une vie très ennuyeuse, rien de particulier", "\n👉 ça fait des heures que je le suis, et que'est-ce qu'il est ennuyeux!!!", "\n👉 Bon! j'ai rien appris du tout, il fait rien de particulier"]
                    response += resp[Math.floor(Math.random() * resp.length)]
                }
            })

            _msg.reply(response);
            if (isDeath) {
                Death(msg.from);
                client.sendMessage(msg.from, introduction_msg)
            } else {
                _msg.reply("Que voulez-vous faire avec *" + actionee_profil.name + '* (' + actionee_profil.id.split('@')[0] + ') ?\n\n' +
                    "1️⃣ Draguer\n" +
                    "2️⃣ Voler\n" +
                    "3️⃣ Tuer\n\n" +
                    "0️⃣ Rien \n_(si vous choisissez de ne rien faire, vous devriez le suivre à nouveau la prochaine fois)_");
            }
        } else {
            if (_msg.body.startsWith('1')) {
                let succeeded = false;
                let isDeath = false;
                let isWerewolf = false;
                let isVampire = false;
                let explication = "";
                actionee_profil.actualGame.roles.forEach(role => {
                    if (index > 0) return
                    if (role.name.toLowerCase().includes('werewolf') && !isDeath) {
                        if (Math.floor(Math.random() * 10) > 4) {
                            let resp = ["Il vous invite chez lui!\nPetit dinner au chandelle!\nAprès le repas, il vous invite a danser, entrainé par la music, vous fermez les yeux.\nEt tout d'un coup! vous sentez une douleur dans votre poitrine\nVous venez d'être transpercé!\n\n*vous êtes mort💀*", "Après une jourée rempli en romance, il vous ramène chez lui.\nUne fois dans sa demeur, la porte se ferme violament, vous vous retournez et n'appercevez qu'une épaise fourrure et des crocs\n\n*Vous êtes mort💀*"]
                            explication += resp[Math.floor(Math.random() * resp.length)]
                            isDeath = true;
                        } else {
                            let resp = ["Il vous invite chez lui!\nPetit dinner au chandelle!\nAprès le repas, il vous invite a danser, entrainé par la music, vous fermez les yeux.\nEt tout d'un coup! vous sentez une douleur sur votre poitrine\nVous venez d'être griffé par un loup-garou!\n\n*vous êtes à présent un loup🐺*", "Après une jourée rempli en romance, il vous ramène chez lui.\nUne fois dans sa demeur, la porte se ferme violament, vous vous retournez et n'appercevez qu'une épaise fourrure et des crocs\n\n*Vous êtes désormais un loup-garou🐺*"]
                            explication += resp[Math.floor(Math.random() * resp.length)]
                            isWerewolf = true;
                            succeeded = true;
                        }
                    } else if (role.name.toLowerCase().includes('vampire') && !isDeath) {
                        if (Math.floor(Math.random() * 10) > 4) {
                            let resp = ["Il vous invite chez lui!\nPetit dinner au chandelle!\nAprès le repas, il vous invite a danser, entrainé par la music, vous fermez les yeux.\nEt tout d'un coup! vous sentez une douleur sur votre coup\nVous venez d'être mordu!\n\n*vous êtes mort, vidé de votre sang💀*", "\n👉Après une jourée rempli en romance, il vous ramène chez lui.\nUne fois dans sa demeur, la porte se ferme violament, vous vous retournez et n'appercevez que des yeux rouges et des crocs\n\n*Vous êtes mort, vidé de votre sang💀*"]
                            explication += resp[Math.floor(Math.random() * resp.length)]
                            isDeath = true;
                        } else {
                            let resp = ["Il vous invite chez lui!\nPetit dinner au chandelle!\nAprès le repas, il vous invite a danser, entrainé par la music, vous fermez les yeux.\nEt tout d'un coup! vous sentez une douleur sur votre poitrine\nVous venez d'être griffé par un loup-garou!\n\n*vous êtes maintenant un vampire🧛", "\n👉Après une jourée rempli en romance, il vous ramène chez lui.\nUne fois dans sa demeur, la porte se ferme violament, vous vous retournez et n'appercevez que des yeux rouges et des crocs\n\n*Vous avez été mordu par un vampire et en êtes désormais un🧛*"]
                            explication += resp[Math.floor(Math.random() * resp.length)]
                            isVampire = true;
                            succeeded = true;
                        }
                    } else if (role.name.toLowerCase().includes('sorcier') && !isDeath) {
                        if (Math.floor(Math.random() * 10) > 6) {
                            let resp = ["Il vous invite chez lui!\nPetit dinner au chandelle!\nAprès le repas, il vous invite a danser, entrainé par la music, vous fermez les yeux.\nVous le regardez dans les yeux, ils vous regarde...\nVous vous embracez mais vous n'êtes plus le même!\n\n*vous êtes maintenant un vampire🧛", "\n👉Après une jourée rempli en romance, il vous ramène chez lui.\nUne fois dans sa demeur, il vous dit qu'il vous aime et qu'il ne pourrai vivre sans vous.\nVous vous embracez, mais après ce baiser vous n'êtes plus la même\n\n*Vous avez été mordu par un vampire et en êtes désormais un🧛*"]
                            explication += resp[Math.floor(Math.random() * resp.length)]
                            isVampire = true;
                            succeeded = true;
                        } else {
                            let resp = ["Malgré une manifique journée avec lui, il ne vous rappele pas.\nIl ne semble pas intérréssé", "Vous le perdez de vue et il s'évapore dans la nature.\nIl est peut-être allé chercher à boire?"]
                            explication += resp[Math.floor(Math.random() * resp.length)]
                        }
                    } else if (!isDeath) {
                        if (Math.floor(Math.random() * 10) > 6) {
                            let resp = ["Vous tombez épardument amoureaux.\nDésormais vous êtes inséparable!\nVous êtes désormais en couple avec " + actionee_profil.name + '* (' + actionee_profil.id.split('@')[0] + ')', "La définition de l'amour fou.\nVous êtes désormais en couple avec " + actionee_profil.name + '* (' + actionee_profil.id.split('@')[0] + ')']
                            explication += resp[Math.floor(Math.random() * resp.length)]
                            succeeded = true;
                        } else {
                            let resp = ["Malgré une manifique journée avec lui, il ne vous rappele pas.\nIl ne semble pas intérréssé", "Vous le perdez de vue et il s'évapore dans la nature.\nIl est peut-être allé chercher à boire?"]
                            explication += resp[Math.floor(Math.random() * resp.length)]
                        }
                    }
                })

                let response = "Une rencontre hazardeuse (enfin... pour lui)\n\nVous êtes allez au restaurant, au cinéma, et vous avez discuté en vous promenant dans le park";
                _msg.reply(response);
                _msg.reply(explication);
                if (isDeath) {
                    Death(msg.from);
                    client.sendMessage(msg.from, "Vous pouvez continuer à vous amuser avec le bot le temps que la partie en cours se termine")
                    client.sendMessage(msg.from, introduction_msg)
                } else {
                    if (isWerewolf) {
                        profil.actualGame.roles.push({ "name": "werewolf" })
                    } else if (isVampire) {
                        profil.actualGame.roles.push({ "name": "vampire" })
                    }
                    if (succeeded) {
                        profil.actualGame.relations.push({ "name": "lover", "playerId": actionee_profil.id })
                    }
                }
            } else if (_msg.body.startsWith('2')) {
                let succeeded = false;
                let isDeath = false;
                let isWerewolf = false;
                let isVampire = false;
                let isMaire = false;
                let explication = "";
                actionee_profil.actualGame.roles.forEach(role => {
                    if (index > 0) return
                    if (role.name.toLowerCase().includes('werewolf') && !isDeath) {
                        if (Math.floor(Math.random() * 10) > 4) {
                            let resp = ["Vous pénétrez dans ça maison\nUn endroit bien sinistre, on dirait qu'il y a une présence!\nUne chose se déplace trés rapidement!\n\n*vous êtes mort💀*", "Une belle maison! Il doit y avoir des tas de trucs de valeur!🤤\nAttend! c'est quoi ce...\n\n*Vous êtes mort💀*"]
                            explication += resp[Math.floor(Math.random() * resp.length)]
                            isDeath = true;
                        } else {
                            let resp = ["Une belle maison! Il doit y avoir des tas de trucs de valeur!🤤\nC'était quoi ce bruit? bref! je vais tout prendre!\n\nEffectivement, vous repartez avec un jolie butin!"]
                            explication += resp[Math.floor(Math.random() * resp.length)]
                            isWerewolf = true;
                            succeeded = true;
                        }
                    } else if (role.name.toLowerCase().includes('vampire') && !isDeath) {
                        if (Math.floor(Math.random() * 10) > 4) {
                            let resp = ["Vous pénétrez dans ça maison\nUn endroit bien sinistre, on dirait qu'il y a une présence!\nVous sentez comme un froid glaciale sur votre coup, comme si...\n\n*vous êtes mort💀*", "Une belle maison! Il doit y avoir des tas de trucs de valeur!🤤\nAttend! c'est quoi ce...\n\n*Vous êtes mort💀*"]
                            explication += resp[Math.floor(Math.random() * resp.length)]
                            isDeath = true;
                        } else {
                            let resp = ["Une belle maison! Il doit y avoir des tas de trucs de valeur!🤤\nC'était quoi ce bruit? bref! je vais tout prendre!\n\nEffectivement, vous repartez avec un jolie butin!"]
                            explication += resp[Math.floor(Math.random() * resp.length)]
                            isVampire = true;
                            succeeded = true;
                        }
                    } else if (role.name.toLowerCase().includes('sorcier') && !isDeath) {
                        if (Math.floor(Math.random() * 10) > 6) {
                            let resp = ["Le temps de mettre un pied dans la maison que vous êtes mort!💀"]
                            explication += resp[Math.floor(Math.random() * resp.length)]
                            isDeath = true;
                        }
                    } else if (role.name.toLowerCase().includes('maire') && !isDeath) {
                        if (Math.floor(Math.random() * 10) > 2) {
                            let resp = ["Wow! ça c'est une belle maison! Il doit y avoir des tas de trucs de valeur!🤤\n\nMalheuresement, le temps de commencer à ramasser le butin, c'est vous qui avait été ramassé! Par une balle...\n\nvous êtes mort!💀"]
                            explication += resp[Math.floor(Math.random() * resp.length)]
                            isDeath = true;
                        } else {
                            isMaire = true;
                            let resp = ["Wow! ça c'est une belle maison! Il doit y avoir des tas de trucs de valeur!🤤\n\nEffectivement, vous rapartez avec un jolie butin!"]
                            explication += resp[Math.floor(Math.random() * resp.length)]
                            succeeded = true;
                        }
                    } else if (!isDeath) {
                        let resp = ["Une belle maison! Il doit y avoir des tas de trucs de valeur!🤤\n\nEffectivement, vous rapartez avec un jolie butin!"]
                        explication += resp[Math.floor(Math.random() * resp.length)]
                        succeeded = true;
                    }
                })

                let response = "Vous avez suivi " + actionee_profil.name + '* (' + actionee_profil.id.split('@')[0] + ') jusqu\'à chez lui';
                _msg.reply(response);
                _msg.reply(explication);
                if (isDeath) {
                    Death(msg.from);
                    client.sendMessage(msg.from, "Vous pouvez continuer à vous amuser avec le bot le temps que la partie en cours se termine")
                    client.sendMessage(msg.from, introduction_msg)
                } else {
                    if (isWerewolf || isVampire) {
                        client.sendMessage(actionee_profil.id, '*Vous avez été cambriolé!*\nMais en partant le voleur vous a laissé des indices que vous pouvez utiliser grace à vos pouvoirs...\n\nIl semblerait que le voleur soit ' + profil.name + '* (' + profil.id.split('@')[0] + ')\nQu\'allez-vous faire?')
                    } else if (isMaire) {
                        client.sendMessage(actionee_profil.id, '*Vous avez été cambriolé!*\nMais en partant le voleur vous a laissé des indices que vous pouvez utiliser grace à vos investigateurs...\n\nIl semblerait que le voleur soit ' + profil.name + '* (' + profil.id.split('@')[0] + ')\nQu\'allez-vous faire?')
                    }
                    if (succeeded) {
                        let stolen_Money = Math.floor(actionee_profil.actualGame.money * 0.8)
                        actionee_profil.actualGame.money -= stolen_Money;
                        profil.actualGame.money += stolen_Money;
                    }
                }
            } else if (_msg.body.startsWith('3')) {

            } else {
                _msg.reply('Ce chiffre n\'est pas dans la liste\nVeillez entrer un chiffre qui correspond à une option')
                return
            }

        }

        fs.outputJSONSync("../users/" + profil.id + "/profil.json", profil)
        fs.outputJSONSync("../users/" + actionee_profil.id + "/profil.json", actionee_profil)
        fs.outputJSONSync("../users/" + group_profil.id + "/profil.json", group_profil)

    })


}

exports.lyncher = function (msg, client, _callback) {

}

exports.enqueter = function (msg, client, _callback) {
    //police

}

exports.visiter = function (msg, client, _callback) {
    //prostituer

}

exports.engagertuer = function (msg, client, _callback) {
    //maire

}

exports.proteger = function (msg, client, _callback) {
    //maire

}

exports.bénir = function (msg, client, _callback) {
    //sorcier

}

exports.maudire = function (msg, client, _callback) {
    //sorcier

}

exports.chasserloup = function (msg, client, _callback) {
    //loup

}

exports.chasservampire = function (msg, client, _callback) {
    //vampire

}

let Death = function (playerId) {
    let profil = fs.readJsonSync("../users/" + playerId + "/profil.json");
    profil.actualGame.isDeath = true;
    let group_profil = fs.readJsonSync("../users/" + profil.actualGame.groupId + "/profil.json");
    group_profil.actualGame.playerList.forEach((_player, index) => {
        if (_player.id == profil.id)
            group_profil.actualGame.playerList[index].isDeath = true;
    })

    fs.outputJSONSync("../users/" + playerId + "/profil.json", profil)
    fs.outputJSONSync("../users/" + profil.actualGame.groupId + "/profil.json", group_profil)
    fs.outputJsonSync("./users/" + playerId + "/discussion.json", [{ "from": playerId, "text": 'hi', "isGame": false, "state": "choose game" }]);

}