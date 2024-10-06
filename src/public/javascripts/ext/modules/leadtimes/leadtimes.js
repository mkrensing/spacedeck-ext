let leadtimes = constructSpacedeckModule("leadtimes");
leadtimes.requires("databinding.js");
leadtimes.loadStylesheets("leadtimes.css");
let spacedeck = leadtimes.use("spacedeck");
spacedeck.requires("spacedeck_adapter.js");
spacedeck.requires("view/templating.js");
spacedeck.requires("view/mustache.js");
spacedeck.loadStylesheets("spacedeck.css");

console.log("in leadtime module")
leadtimes.ready(function() {

    console.log("Leadtimes loaded");
    let spacedeckAdapter = constructSpacedeckAdapter();
    console.log("spacedeckAdapter", spacedeckAdapter);

    let templateLoader = constructTemplateLoader("boards/simple/templates/");
    templateLoader.load(["issue_marker.html", "issue_popup.html"], function(issue_marker, issue_popup) {
        
        let artifactDataBinding = constructJiraArtifactDataBinding(issue_marker, issue_popup);
        
        let jiraKeyRegEx = /(JT-\d*):/;
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

        artifacts.forEach(artifact => {
            let key = extractJiraKey(artifact);
            artifact.tags = { jira: { key: key, daysInStatus: "?" } };
            artifactDataBinding.update(artifact);
        });
    })


});