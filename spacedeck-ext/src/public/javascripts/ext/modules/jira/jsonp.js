class LoadingContext {

    constructor() {

        this.startDelayInMillis = 1000;
        this.stopDelayInMilis = 500;
        this.spacedeckAdapter = constructSpacedeckAdapter();
        this.activeLoadings = {};
    }

    setStartDelayInMillis(startDelayInMillis) {
        this.startDelayInMillis = startDelayInMillis;
    }

    setStopDelayInMilis(stopDelayInMilis) {
        this.stopDelayInMilis = stopDelayInMilis;
    }

    start(url) {

        let _this = this;
        window.setTimeout(function () {

            if (_this.activeLoadings[url]) {
                _this.spacedeckAdapter.loadingStart();
            }

        }, this.startDelayInMillis);
        this.activeLoadings[url] = true;
    }

    stop(url) {

        delete this.activeLoadings[url];
        let _this = this;
        window.setTimeout(function () {

            if (!_this.isLoadingActive()) {
                _this.spacedeckAdapter.loadingStop();

            }

        }, this.stopDelayInMilis);
    }

    getActiveLoadingCount() {
        return this.activeLoadings.length;
    }

    isLoadingActive() {
        return this.getActiveLoadingCount() > 0;
    }

}

class JSONPClient {

    constructor() {

        this.loading = new LoadingContext();
        this.loading.setStartDelayInMillis(2000);
        this.loading.setStopDelayInMilis(500);
    }

    postJSON(url, body, callbacks) {

        let urlWithData = this.buildUrl(url, { body: JSON.stringify(body) });
        return this.getJSON(urlWithData, callbacks);
    }

    buildUrl(url, queryData) {

        queryData = encodeQueryData(queryData);
        if (url.includes("?")) {
            return url + "&" + queryData;
        }

        return url + "?" + queryData;
    }

    getJSON(url, callbacks) {

        if (!callbacks) {
            callbacks = {};
        }

        if (!callbacks.background) {
            this.loading.start(url);
        }

        let _this = this;
        return $.ajax({
            url: url,
            type: 'get',
            contentType: "application/json",
            dataType: "jsonp",
            jsonp: "callback",
            beforeSend: function (xhr) {
                
                xhr.requestUrl = url;
                if (callbacks.beforeSend) {
                    callbacks.beforeSend(xhr);
                }
            },

            success: function (data, status_message, xhr) {

                if (data && data.error && data.error_code) {
                    let xhrFacade = {
                        requestUrl: xhr.requestUrl,
                        status: data.error_code,
                        responseText: JSON.stringify(xhr.responseJSON),
                        original: xhr
                    }

                    if (callbacks.error) {
                        callbacks.error(createErrorObject(xhrFacade, data.error_code, data.error));

                    } else {

                        default_error_callback(createErrorObject(xhrFacade, data.error_code, data.error));

                    }

                    return;
                }

                if (callbacks.success) {
                    callbacks.success(data);
                }

            },

            error: function (xhr, status_code, status_message) {
                console.log("error", xhr.status, status_message, xhr.requestUrl);
                if (callbacks.error) {
                    callbacks.error(createErrorObject(xhr, status_code, status_message));
                } else {
                    default_error_callback(createErrorObject(xhr, status_code, status_message));
                }
            },

            complete: function (xhr, textStatus) {

                _this.loading.stop(url);



                if (callbacks.complete) {

                    callbacks.complete(xhr, textStatus);

                }

            }

        });

    }







}



function encodeQueryData(data) {

    const ret = [];

    for (let d in data)

        ret.push(fixedEncodeURIComponent(d) + '=' + fixedEncodeURIComponent(data[d]));

    return ret.join('&');

}



function fixedEncodeURIComponent(str) {

    return encodeURIComponent(str).replace(/[!'()*]/g, escape);

}



function createErrorObject(xhr, errorClass, status_message) {



    return {

        url: xhr.requestUrl,

        error_code: xhr.status,

        status_message: status_message,

        message: xhr.responseText

    }

}



function default_error_callback(error) {



    console.log("Error in XHR-Request", error.url, "status code", error.error_code, "status_message", error.status_message, "response", error.message);

}



function constructJSONPClient() {

    return new JSONPClient();

}

