
const fs = require('fs-extra');

exports.getUser = function (id) {
    let user = null;
    if (fs.pathExistsSync("users/" + id + "/profil.json")) {
        user = fs.readJsonSync("users/" + id + "/profil.json");
    }
    return user;
}

exports.setUser = function (id, userData) {
    
        userList = fs.readJsonSync("users/users.json");
        let found = false;
        userList.forEach(user => {
            if(user.id == id)
            found = true
        });
        if(!found){
            userList.push({"id" : id})
            fs.outputJsonSync("users/" + id + "/profil.json", userData);
            fs.outputJsonSync("users/" + id + "/discussion.json", [{ "from": id, "text": "", "isGame": false, "state": "choose game" }]);
        }
        
    fs.outputJsonSync("users/users.json", userList);

    return;
}