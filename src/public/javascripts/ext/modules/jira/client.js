class URLBuilder {

    constructor(urlTemplate) {
        this.urlTemplate = urlTemplate;
        this.paths = {};
        this.params = {};
        this.hostname = "";
    }

    host(hostname) {
        this.hostname = hostname;
        return this;
    }

    path(name, value) {
        this.paths[name] = value;
        return this;
    }

    param(name, value) {
        this.params[name] = value;
        return this;
    }

    build() {
        let baseUrl = this.hostname + this.urlTemplate;
        for(let pathPart in this.paths) {
            baseUrl = baseUrl.replaceAll("{" + pathPart + "}", this.paths[pathPart]);
        }
        let url = new URL(baseUrl);
        for(let paramName in this.params) {
            url.searchParams.append(paramName, this.params[paramName]);
        }            
        
        return url.href;
    }

}

class JIRAClient {

    constructor(proxy, endpointId, expand) {
        this.proxy = proxy;
        this.endpointId = endpointId;
        this.expand = expand;
        this.jsonpClient = constructJSONPClient();
        this.cache = constructJsonCache();
    }

    useUrl(urlTemplate) {
        let url = new URLBuilder(urlTemplate);
        url.host(this.proxy);
        url.param("endpoint_id", this.endpointId);

        return url;
    }

    issue(issueId, successCallbackFunction, failureCallbackFunction) {

        let _this = this;
        let url = this.useUrl("/jira/issue/{issueId}").path("issueId", issueId).build();

        return this.jsonpClient.getJSON(url, {
            success: function (issue) {
                successCallbackFunction(issue);
            },
            error: failureCallbackFunction
        });
    }

    search(jql, successCallbackFunction, failureCallbackFunction) {

        let _this = this;
        let url = this.useUrl("/jira/search").param("jql", jql).param("expand", this.expand).build();        

        return this.jsonpClient.getJSON(url, {

            success: function (response) {
                response.issues.forEach(function (issue) {
                    _this.cache.add(issue.key, issue);
                });

                successCallbackFunction(response.issues);
            },

            error: failureCallbackFunction
        });
    }
}

function constructJIRAClient(config) {

    return new JIRAClient(config.proxy, config.endpoint_id, config.expand);
}

