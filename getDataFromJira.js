var getNextStepsFromJira = function() {
    var nextSteps = jsonResponse.issues;

    for(var i = 0; i < nextSteps.length; i++){
        nextSteps[i].type = "nextStep";
    }

    return nextSteps;
}

var getCards = function(callback) {
    callback([
        {active: true, type:'issue', id:"1", fields: { issueType: { name: "Defect" }, summary: "Website can't be accessed over ssl", description: "the description of issue 1", "issuelinks": [
                	{ "outwardissue" : { "id" : "10231" } }
                ] }},
        {active: true, type:'issue', id:"2", fields: { issueType: { name: "Defect" }, summary: "Website is using an old version of jquery", description: "the description of issue 2" , "issuelinks": [
                	{ "outwardissue" : { "id" : "10231" } },
                	{ "outwardissue" : { "id" : "10012" } },
                ]  }},
        {active: true, type:'awesome', id:"3", fields: { issueType: { name: "Improvement" },  summary: "SSL should be the default choice by the bank", description: "the definition of awesome 1", "issuelinks": [
                	{ "inwardissue" : { "id" : "10005" } }
                ]   }},
        {active: true, type:'awesome', id:"4", fields: { issueType: { name: "Improvement" },  summary: "Latest suitable version of all frameworks", description: "the definition of awesome 2", "issuelinks": [
                	{ "inwardissue" : { "id" : "10011" } },
                ] }},
    ].concat(getNextStepsFromJira()));
}
