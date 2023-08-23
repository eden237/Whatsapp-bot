let FileName = "1001_sexual.json"
let category = "sexual"
const fs = require('fs-extra');
let jokeList = fs.readJsonSync("./_jokes/joke_list.json")

let txt = fs.readFileSync("../jokes.txt", 'utf-8')
txt = txt.replaceAll('/*-\r','\r\n')
txt = txt.split('\r\n')

let jokes = fs.pathExistsSync("./_jokes/"+FileName) ? fs.readJsonSync("./_jokes/"+FileName) : [];

let index = jokes.length;
let joke = "";
txt.forEach( (_txt, i) => {
    if(_txt.trim().length == 0 || i == txt.length-1){
        joke += _txt+"\n"
        jokes.push(joke)
        joke = "";
    }else{
        joke += _txt+"\n"
    }
})
console.log(jokes.length, jokes[jokes.length-1])

let isFound = false
jokeList.map( (_question, index) => {
    if(_question.category == category){
        jokeList[index].length += jokes.length
     isFound = true;
    }
})

if(!isFound){
    jokeList.push({
        "category" : category,
        "length" : jokes.length,
        "fileName" : FileName
    })
}

fs.outputJsonSync("./_jokes/"+FileName, jokes);
fs.outputJsonSync("./_jokes/joke_list.json", jokeList);
