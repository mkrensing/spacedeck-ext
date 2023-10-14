function init()  {

    let teamboard = constructSpacedeckBoard("simple");
    teamboard.requires("simple_config.js");
    teamboard.requires("databinding.js");
    teamboard.loadStylesheets("taskboard.css");

    let spacedeck = teamboard.use("spacedeck");
    spacedeck.requires("spacedeck_adapter.js");
    spacedeck.requires("artifact_factory.js");
    spacedeck.requires("util/config_parser.js");
    spacedeck.requires("util/svg_background_parser.js");
    spacedeck.requires("util/inkscape_svg.js");
    spacedeck.requires("view/grid_align.js");
    spacedeck.requires("view/templating.js");
    spacedeck.requires("view/mustache.js");

    spacedeck.loadStylesheets("spacedeck.css");

    let jira = teamboard.use("jira");
    jira.requires("client.js");
    jira.requires("jsonp.js");
    jira.requires("cache.js");
    jira.requires("taskboard.js");
    jira.requires("sync_service.js");
    jira.requires("issue.js");

    teamboard.ready(function() {
        let spacedeckAdapter = constructSpacedeckAdapter();
        let config = constructConfigParser(lookupConfig()).parse();
        let jira = constructJIRAClient(config["JIRA"]);

        console.log("Loading", spacedeckAdapter.getSpaceId());

        let svgBackgroundParser = constructSVGBackgroundParser();
        svgBackgroundParser.parse(function(svg) {

            let templateLoader = constructTemplateLoader("boards/simple/templates/");
            templateLoader.load(["issue_marker.html", "issue_popup.html"], function(issue_marker, issue_popup) {
                
                let artifactDataBinding = constructJiraArtifactDataBinding(issue_marker, issue_popup);

                // TODO: taskboard.js und sync_service.js zusammenführen
                let teamboard = constructTaskboard(svg, "Teamboard", config["JIRA"]["Teamboard"]);
                teamboard.render();
    
                let jiraSyncService = constructJiraSyncService(jira, teamboard);
                jiraSyncService.onUpdate(function(artifacts) {

                    artifacts.forEach(function(artifact, index) {

                        spacedeckAdapter.waitForArtifactDiv(artifact, function() {
                            artifactDataBinding.update(artifact);
                        });
                        
                    });
                });

                jiraSyncService.sync();                
            });

        });
    });
}

init();