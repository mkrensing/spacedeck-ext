
class IssueMarkerBinding {

    constructor(template, artifact) {
        this.template = template;
        this.artifact = artifact;
        this.targetDivId = this.template.getName() + "-" + this.artifact._id;
        this.onClickCallback = null;
    }

    update() {
        let _this=this;
        if(! this.existsTargetDiv()) {
            this.getArtifactDiv().prepend(this.createTemplateContainer());
        } 

        $('#' + this.targetDivId).html(this.render());
        $('#' + this.targetDivId + " .issue_link").off().click(function() {
            _this.fireClick();
        });
    }

    render() {
        return this.template.render(this.artifact.tags);
    }

    fireClick() {
        if(this.onClickCallback) {
            this.onClickCallback(this.artifact);
        }
    }   

    existsTargetDiv() {
        return $('#' + this.targetDivId).length > 0;
    }

    getArtifactDiv() {
        return constructSpacedeckAdapter().getArtifactDiv(this.artifact);
    }    

    createTemplateContainer() {
        return "<div id='" + this.targetDivId + "' class='" + this.template.getName() + "'></div>";
    }

    onClick(callback) {
        this.onClickCallback = callback;
    }

 
}

class IssueDetailBinding {

    constructor(template, artifact) {
        this.template = template;
        this.artifact = artifact;
        this.targetDivId = this.template.getName();
    }

    show() {
        let _this=this;
        $('#' + this.targetDivId).show();

        $('#' + this.targetDivId + " #close_button").off().click(function() {
            $('#' + _this.targetDivId).hide();
        });
    }

    update() {
        let _this=this;
        if(! this.existsTargetDiv()) {
            this.getMainDiv().prepend(this.createTemplateContainer());
        } 

        $('#' + this.targetDivId).html(this.render());
    }

    existsTargetDiv() {
        return $('#' + this.targetDivId).length > 0;
    }

    getMainDiv() {
        return $('#main');
    }    

    createTemplateContainer() {
        return "<div id='" + this.targetDivId + "' class='" + this.template.getName() + "'></div>";
    }

    render() {
        return this.template.render(this.artifact.tags);
    }
}

class JiraArtifactDataBinding {

    constructor(issueMarker, issueDetail, config) {
        this.issueMarker = issueMarker;
        this.issueDetail = issueDetail;
        this.config = config;
    }

    update(artifact) {

        let _this=this;
        let issueMarkerBinding = new IssueMarkerBinding(this.issueMarker, artifact);
        
        if(this.issueDetail) {
            issueMarkerBinding.onClick(function(artifact) {
                let issueDetailBinding = new IssueDetailBinding(_this.issueDetail, artifact);
                issueDetailBinding.update();
                issueDetailBinding.show();
            });
        } else {
            issueMarkerBinding.onClick(function(artifact) {
                let key = artifact.tags.jira.key;
                window.open(_this.config.jiraBrowseUrl + key, "_jira_details");
            });
        }
        
        issueMarkerBinding.update();

    }
}

function constructJiraArtifactDataBinding(issueMarker, issueDetail, config) {
    return new JiraArtifactDataBinding(issueMarker, issueDetail, config);
}