var getNextStepsFromJira = function() {
    var nextSteps = jsonResponse.issues;

    for(var i = 0; i < nextSteps.length; i++){
        nextSteps[i].type = "nextStep";
    }

    return nextSteps;
}

var getCards = function() {
    return [
        {type:'issue', id:"1", fields: { summary: "issue 1", issuetype: { description: "the description of issue 1" } }},
        {type:'issue', id:"2", fields: { summary: "issue 2", issuetype: { description: "the description of issue 2" } }},
        {type:'awesome', id:"3", fields: { summary: "def of awesome 1", issuetype: { description: "the definition of awesome 1" } }},
        {type:'awesome', id:"4", fields: { summary: "def of awesome 2", issuetype: { description: "the definition of awesome 2" } }},
    ];
}

var getLinks = function(){
    return [["1","10230"],["10230","3"],["2","10004"],["10004","4"]];
}