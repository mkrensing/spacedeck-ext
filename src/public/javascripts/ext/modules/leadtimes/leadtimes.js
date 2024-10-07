let leadtimes = constructSpacedeckModule("leadtimes");
leadtimes.requires("databinding.js");
leadtimes.requires("rest_client.js");
leadtimes.requires("proxy_client.js");
leadtimes.loadStylesheets("leadtimes.css");
let spacedeck = leadtimes.use("spacedeck");
spacedeck.requires("spacedeck_adapter.js");
spacedeck.requires("view/templating.js");
spacedeck.requires("view/mustache.js");
spacedeck.requires("util/config_parser.js");
spacedeck.loadStylesheets("spacedeck.css");
 

leadtimes.ready(function() {
 
    let config = constructConfigParser({}).parse();       
    console.log("Leadtimes loaded", config);
    let spacedeckAdapter = constructSpacedeckAdapter();
 
 
    let templateLoader = constructTemplateLoader("boards/simple/templates/");
    templateLoader.load(["issue_marker.html" ], function(issue_marker) {
       
        let artifactDataBinding = constructJiraArtifactDataBinding(issue_marker, null, config);
       
        let jiraKeyRegEx = new RegExp(config.jiraRegex);
        function findJiraArtifacts(artifact) {
            return jiraKeyRegEx.test(getArtifactDescription(artifact))
        }
 
        function extractJiraKey(artifact) {
            return (getArtifactDescription(artifact).match(jiraKeyRegEx) || [""])[1]
        }
 
        function extractDayInStatus(result, key) {
 
            let daysInStatus = parseInt(result.leadtimes.resolved[key])
            if(isNaN(daysInStatus)) {
                daysInStatus = parseInt(result.leadtimes.unresolved[key])
            }
            if(isNaN(daysInStatus)) {
                return 0;
            }
 
            if(daysInStatus == -1) {
                daysInStatus = "-"
            } else {
                daysInStatus = Math.max(1, daysInStatus);
            }
 
            return daysInStatus;
        }
   
        function updateArtifacts(artifacts, result) {
            artifacts.forEach(artifact => {
                let key = extractJiraKey(artifact);
                let daysInStatus = extractDayInStatus(result, key);
                console.log("key", key, daysInStatus);
 
               artifact.tags = { jira: { key: key, daysInStatus: daysInStatus } };
                artifactDataBinding.update(artifact);
            });  
        }
 
        let artifacts = spacedeckAdapter.findArtifacts(artifact => findJiraArtifacts(artifact));
        let keys = artifacts.map(artifact => extractJiraKey(artifact)).sort((a,b) => a.localeCompare(b));
        let client = constructProxyClient();

        client.getJson(config.jiraUrl, { "keys": keys.join(","), "startState": config.jiraStartState}).then(result => {
            updateArtifacts(artifacts, result);
        }).catch(error => {
            console.error("Error in leadtimes.js", error);
        });
 
        let updateButton = spacedeckAdapter.findArtifactByText(config.jiraUpdateButton);
        if(updateButton) {
            let updateButtonDiv = spacedeckAdapter.getArtifactDiv(updateButton);
            $(updateButtonDiv).click(function() {
                spacedeckAdapter.loadingStart();
                let keys = artifacts.map(artifact => extractJiraKey(artifact)).sort((a,b) => a.localeCompare(b));
                client.getJson(config.jiraUrl, { "keys": keys.join(","), "useCache": "false", "startState": config.jiraStartState },  { "x-target-host": config.jiraServer}).then(result => {
                    spacedeckAdapter.loadingStop();
                    let artifacts = spacedeckAdapter.findArtifacts(artifact => findJiraArtifacts(artifact));
                    updateArtifacts(artifacts, result);
 
                }).catch(error => {
                    spacedeckAdapter.loadingStop();
                    console.error("Error in leadtimes.js", error);
                });
            });
        }
 
    })
  
});
 