let FileName = "gk_questions_en.json"
let category = "General Knowledge (Cameroun)"
const fs = require('fs-extra');
let questionList = fs.readJsonSync("./_Questions/question_list.json")

let txt = fs.readFileSync("../questions.txt", 'utf-8')
txt = txt.replace(/[\r]/g,'').replaceAll('D. ','').replaceAll('A. ','').replaceAll('B. ','').replaceAll('C. ','')
txt = txt.split('\n')

let counter = 0, num = txt.length/5;
let questions = fs.pathExistsSync("./_Questions/"+FileName) ? fs.readJsonSync("./_Questions/"+FileName) : [];

while(counter < txt.length){
    questions.push({
        "category": category,
        "type":"multiple",
        "difficulty":"medium",
        "question":txt[counter],
        "correct_answer":txt[counter+1],
        "incorrect_answers":[txt[counter+2],txt[counter+3],txt[counter+4]]
    })
    counter += 5;
    console.log(""+counter/5)
}
console.log(questions.length, questions[0])

let isFound = false
questionList.map( (_question, index) => {
    if(_question.category == category){
     questionList[index].length += questions.length
     isFound = true;
    }
})

if(!isFound){
    questionList.push({
        "category" : category,
        "length" : questions.length,
        "fileName" : FileName
    })
}

fs.outputJsonSync("./_Questions/"+FileName, questions);
fs.outputJsonSync("./_Questions/question_list.json", questionList);
