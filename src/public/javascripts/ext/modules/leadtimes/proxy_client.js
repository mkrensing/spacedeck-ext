class ProxyClient {

    constructor() {
        this.restClient = constructRestClient();
    }

    getJson(url, parameters, headers) {

        let targetHost = this.getProtocolAndHost(url);
        let proxyUrl = "/proxy" + this.getPathAndQuery(url);
        let proxyHeaders = { ...(headers || {}), "x-target-host": targetHost } 

        return this.restClient.getJson(proxyUrl, parameters, proxyHeaders);
    }

    getProtocolAndHost(url) {
        const parsedUrl = new URL(url);
        return `${parsedUrl.protocol}//${parsedUrl.host}`;
    }

    getPathAndQuery(url) {
        const parsedUrl = new URL(url);
        return decodeURIComponent(`${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`);
    }

}

function constructProxyClient() {
    return new ProxyClient();
}