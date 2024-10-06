let leadtimes = constructSpacedeckModule("leadtimes");
leadtimes.requires("databinding.js");
leadtimes.requires("rest_client.js");
leadtimes.loadStylesheets("leadtimes.css");
let spacedeck = leadtimes.use("spacedeck");
spacedeck.requires("spacedeck_adapter.js");
spacedeck.requires("view/templating.js");
spacedeck.requires("view/mustache.js");
spacedeck.requires("util/config_parser.js");
spacedeck.loadStylesheets("spacedeck.css");

console.log("in leadtime module")
leadtimes.ready(function() {

    let config = constructConfigParser({}).parse();        
    console.log("Leadtimes loaded", config);
    let spacedeckAdapter = constructSpacedeckAdapter();

    let templateLoader = constructTemplateLoader("boards/simple/templates/");
    templateLoader.load(["issue_marker.html" ], function(issue_marker) {
        
        let artifactDataBinding = constructJiraArtifactDataBinding(issue_marker);
        
        let jiraKeyRegEx = new RegExp(config.jiraRegex);
        function findJiraArtifacts(artifact) {
            let description=$(artifact.description).text();
            return jiraKeyRegEx.test(description)
        }

        function extractJiraKey(artifact) {
            let description=$(artifact.description).text();
            return (description.match(jiraKeyRegEx) || [""])[1]
        }
    
        let artifacts = spacedeckAdapter.findArtifacts(artifact => findJiraArtifacts(artifact));
        let keys = artifacts.map(artifact => extractJiraKey(artifact));
        
        let client = constructRestClient();
        client.getJson(config.jiraUrl, { "keys": keys.join(",")}, { "x-target-host": config.jiraServer}).then(result => {

            artifacts.forEach(artifact => {
                let key = extractJiraKey(artifact);
                let daysInStatus = result.leadtimes.resolved[key] || result.leadtimes.unresolved[key];
                if(daysInStatus == -1) {
                    daysInStatus = "-"
                }
                artifact.tags = { jira: { key: key, daysInStatus: daysInStatus } };
                artifactDataBinding.update(artifact);
            });            

        });


    })


});