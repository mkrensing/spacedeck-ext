class JIRAClient {

    constructor(server) {

        this.server = server;
        this.jsonpClient = constructJSONPClient();
        this.cache = constructJsonCache();
    }


    getIssue(issueId, successCallbackFunction, failureCallbackFunction) {

        let cachedValue = this.cache.get(issueId);

        if (cachedValue) {

            // console.log("getIssue from cache", cachedValue);
            successCallbackFunction(cachedValue);
            return;
        }

        // throw "Issue not found in Cache " + issueId;

        let url = this.server + "/restspi/jira/issue/" + issueId;

        let _this = this;

        return this.jsonpClient.getJSON(url, {

            success: function (issue) {

                _this.cache.add(issue.key, issue);

                successCallbackFunction(issue);

            },

            error: function (xhr, status_code, status_message) {



                if (failureCallbackFunction) {

                    failureCallbackFunction(xhr, status_code, status_message)

                } else {

                    default_error_callback(xhr, status_code, status_message);

                }

            }

        });

    }



    getIssues(issueIds, successCallbackFunction, finallyCallback, failureCallbackFunction) {

        let _this = this;

        this.withChunk(issueIds, 20, function (issueIdsChunk) {

            return _this.getIssuesInBatches(issueIdsChunk, successCallbackFunction, failureCallbackFunction);

        }, finallyCallback);

    }



    withChunk(objects, chunkSize, callback, finallyCallback) {



        let callbackFutures = [];

        for (let i = 0; i < objects.length; i += chunkSize) {

            const chunk = objects.slice(i, i + chunkSize);

            callbackFutures.push(callback(chunk));

        }



        $.when(...callbackFutures).done(function () {

            finallyCallback();

        })

    }



    getIssuesInBatches(issueIds, successCallbackFunction, failureCallbackFunction) {



        let issueIdString = issueIds.sort().join(",");



        let _this = this;

        let url = this.server + "/restspi/jira/issues/" + issueIdString;

        return this.jsonpClient.getJSON(url, {

            success: function (issues) {



                issues.forEach(function (issue) {

                    _this.cache.add(issue.key, issue);

                });



                successCallbackFunction(issues);

            },

            error: failureCallbackFunction,

            background: true

        });

    }



    getIssuesForProject(projectId, ignoreIssues, successCallbackFunction, failureCallbackFunction) {

        let _this = this;

        let url = this.server + "/restspi/jira/issuesForProject/" + projectId + "?ignore=" + ignoreIssues;

        return this.jsonpClient.getJSON(url, {

            success: function (issuesForStatus) {



                for (let status in issuesForStatus) {

                    issuesForStatus[status].forEach(function (issue) {

                        _this.cache.add(issue.key, issue);

                    });

                }



                successCallbackFunction(issuesForStatus);

            },

            error: failureCallbackFunction

        });

    }



    getStoriesForProjectIssue(projectIssueId, successCallbackFunction, failureCallbackFunction) {

        let _this = this;

        let url = this.server + "/restspi/jira/programboard/storyForProject/" + projectIssueId;

        return this.jsonpClient.getJSON(url, {

            success: function (issues) {



                issues.forEach(function (issue) {

                    _this.cache.add(issue.key, issue);

                });



                successCallbackFunction(issues);

            },

            error: failureCallbackFunction

        });

    }





    getWIPReport(projectId, issueType, successCallbackFunction, failureCallbackFunction) {

        let jsonpClient = this.jsonpClient;

        let url = this.server + "/restspi/jira/report/wip/" + projectId + "/" + issueType;

        return this.jsonpClient.getJSON(url, {

            success: function (data) {

                successCallbackFunction(data);

            },

            error: failureCallbackFunction

        });

    }



    changeState(issueId, newState, successCallbackFunction, failureCallbackFunction) {



        let url = this.server + "/restspi/jira/changeState/" + issueId + "/" + newState;

        return this.jsonpClient.getJSON(url, {

            success: function (data) {

                successCallbackFunction(data);

            },

            error: failureCallbackFunction

        });

    }



    search(jql, successCallbackFunction, failureCallbackFunction) {

        let _this = this;

        let url = this.server + "/restspi/jira/search/" + jql;

        return this.jsonpClient.getJSON(url, {

            success: function (issues) {



                issues.forEach(function (issue) {

                    _this.cache.add(issue.key, issue);

                });



                successCallbackFunction(issues);

            },

            error: failureCallbackFunction

        });

    }

}



function constructJIRAClient(server) {

    return new JIRAClient(server);

}

