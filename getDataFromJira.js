var getNextStepsFromJira = function() {
    var nextSteps = jsonResponse.issues;

    for(var i = 0; i < nextSteps.length; i++){
        nextSteps[i].type = "nextStep";
    }

    return nextSteps;
}

var getCards = function() {
    return [
        {active: true, type:'issue', id:"1", fields: { summary: "Website can't be accessed over ssl", issuetype: { description: "the description of issue 1" } }},
        {active: true, type:'issue', id:"2", fields: { summary: "Website is using an old version of jquery", issuetype: { description: "the description of issue 2" } }},
        {active: true, type:'issue', id:"5", fields: { summary: "Static files are unnecessary large", issuetype: { description: "the description of issue 2" } }},
        {active: true, type:'awesome', id:"3", fields: { summary: "SSL should be the default choice by the bank", issuetype: { description: "the definition of awesome 1" } }},
        {active: true, type:'awesome', id:"4", fields: { summary: "Latest suitable version of all frameworks", issuetype: { description: "the definition of awesome 2" } }},
    ];
}

var getLinks = function() {
    return [{
        issue:"1",
        awesome:"3",
        nextSteps: [["1","10231"],["10231","10005"],["10005","3"]]
    },{
        issue:"2",
        awesome:"4",
        nextSteps: [["2","10231"],["10012","10001"],["2","10012"],["10231","10011"],["10001","10011"],["10011","4"]]
    }];
}