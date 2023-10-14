

class JiraSyncService {

    constructor(jiraClient, taskboard) {
        this.jiraClient = jiraClient;
        this.taskboard = taskboard;
        this.updateCallback = null;
    }

    sync() {
        let jiraArtifactsOnBoard = this.getExistingJiraArtifactsIndexByKey();
        
        for(let columnName in this.taskboard.columns) {
            this.syncColumn(this.taskboard.columns[columnName], jiraArtifactsOnBoard);
        };
    }

    onUpdate(updateCallback) {
        this.updateCallback = updateCallback;
    }

    fireUpdate(artifacts) {
        this.updateCallback(artifacts);
    }

    syncColumn(column, jiraArtifactsOnBoard) {

        let _this=this;
        let artifactFactory = constructArtifactFactory();
        this.jiraClient.search(column.config.jql, function(issues) {
                
            console.log("Loaded JIRA items for ", column, issues);
            
            let issueSeparator = new IssueSeparator(jiraArtifactsOnBoard, issues);
            let newIssues = issueSeparator.getNewIssues();
            let existingIssues = issueSeparator.getExistingIssues();
            let existingArtifacts = issueSeparator.getExistingArtifacts();

            // update existing issues:
            existingIssues.forEach(function(issue, index) {
    
                jiraArtifactsOnBoard[issue.key].tags.jira = _this.buildJiraTag(column, issue);
            });  

            // add new issues:
            if(newIssues.length > 0) {
                let artifactDefinitions = _this.buildArtifactDefinitions(column, newIssues);
                artifactFactory.cloneArtifacts(artifactDefinitions, function(clonedArtifacts) {
                    
                    let allArtifactsInColumn = issueSeparator.getAllArtifactsInCorrectOrder(clonedArtifacts);
                    
                    _this.updateView(column, allArtifactsInColumn);

                });

            } else {

                // Align existing artifacts:
                _this.updateView(column, existingArtifacts);
            }

        });
    }

    updateView(column, artifacts) {

        // Align all artifacts for this column: 
        this.alignArtifacts(column.divSelector, artifacts);

        // Update data
        this.fireUpdate(artifacts);
    }

    alignArtifacts(divSelector, jiraArtifacts) {

        let spacedeckAdapter = constructSpacedeckAdapter();
        let gridAlgin = constructGridAlign(divSelector);
        gridAlgin.arrange(jiraArtifacts);

        jiraArtifacts.forEach(function(artifact, index) {
            spacedeckAdapter.saveArtifact(artifact);
        });
    }



    getExistingJiraArtifactsIndexByKey() {
        let spacedeckAdapter = constructSpacedeckAdapter();
        let jiraArtifactsOnBoard = spacedeckAdapter.findArtifactsByTag("jira");
        
        return spacedeckAdapter.buildIndex(jiraArtifactsOnBoard, function(artifact) { return artifact.tags.jira.key });
    }

    buildArtifactDefinitions(column, issues) {

        let artifactDefinitions = [];
        let _this=this;
        issues.forEach(function(issue, index) {

            artifactDefinitions.push(_this.buildArtifactDefinition(column, issue));
        });

        return artifactDefinitions;
    }

    buildArtifactDefinition(column, issue) {

        return { description: issue.fields.summary, x: column.dimensions.x, y: column.dimensions.y, type: issue.fields.issuetype.name, tags: { jira: this.buildJiraTag(column, issue) } } 
    }

    buildJiraTag(column, issue) {

        issue.browseUrl = this.buildIssueBrowseUrl(issue);

        if(column.config.daysInStatus) {
            issue.daysInStatus = column.config.daysInStatus(issue);
        }
        issue.daysTillCreated = getDiffInDays(issue.fields.created);

        console.log("buildJiraTag", issue);
        return issue;
    }

    buildIssueBrowseUrl(issue) {
        return new URL(issue.self).protocol + "//" + new URL(issue.self).hostname + "/browse/" + issue.key;
    }
}

class IssueSeparator {

    constructor(jiraArtifactsOnBoard, issues) {
        this.newIssues = [];
        this.existingIssues = [];
        this.existingArtifacts = [];
        this.issues = issues;
        let _this=this;

        issues.forEach(function(issue, index) {
            if(jiraArtifactsOnBoard[issue.key]) {
                _this.existingIssues.push(issue);
                _this.existingArtifacts.push(jiraArtifactsOnBoard[issue.key]);
            } else {
                _this.newIssues.push(issue);
            }
        });
    }

    getNewIssues() {
        return this.newIssues;
    }

    getExistingIssues() {
        return this.existingIssues;
    }

    getExistingArtifacts() {
        return this.existingArtifacts;
    }

    getAllArtifactsInCorrectOrder(newArtifacts) {

        let spacedeckAdapter = constructSpacedeckAdapter();
        let newArtifactsIndexedByKey = spacedeckAdapter.buildIndex(newArtifacts, function(artifact) { return artifact.tags.jira.key });
        let existingArtifactsIndexedByKey = spacedeckAdapter.buildIndex(this.existingArtifacts, function(artifact) { return artifact.tags.jira.key });
        let allArtifacts = [];

        this.issues.forEach(function(issue) {
            if(existingArtifactsIndexedByKey[issue.key]) {
                allArtifacts.push(existingArtifactsIndexedByKey[issue.key]);
            } else if(newArtifactsIndexedByKey[issue.key]) {
                allArtifacts.push(newArtifactsIndexedByKey[issue.key]);
            }
        });

        return allArtifacts;
    }

}



function constructJiraSyncService(jiraClient, taskboard) {

    return new JiraSyncService(jiraClient, taskboard);
}