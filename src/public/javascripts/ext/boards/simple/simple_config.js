let config = { 
"localhost" : {
    "JIRA" : {
        "proxy" : "http://localhost:8888",
        "endpoint_id": "214036311874631563446",
        "expand" : "changelog",
        "Teamboard" : {
            "TODO": { jql: "project = 'SPAC' and status = 'To Do' order by rank", daysInStatus: daysInStatusTODO },
            "InProgress": { jql: "project = 'SPAC' and status = 'In Progress' order by rank", daysInStatus: daysInStatusInProgress },
            "Done": { jql: "project = 'SPAC' and status = 'Done' order by rank", daysInStatus: daysInStatusDone }
        }
    }
}, 
"krensing.com" : { } };

function lookupConfig() {
    let hostname = window.location.hostname;
    return config[hostname];
}

// requires modules/jira/issue.js

function daysInStatusTODO(issue) {

    return lastChangeOfField(issue, "status", "To Do");
}

function daysInStatusInProgress(issue) {

    return lastChangeOfField(issue, "status", "In Progress");
}

function daysInStatusDone(issue) {

    return lastChangeOfField(issue, "status", "Done");
}

