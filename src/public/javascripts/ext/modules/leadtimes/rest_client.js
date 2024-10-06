class RestClient {

    getJson(url, parameters, headers) {
        return new Promise((resolve, reject) => {
            let args = { method: 'GET', 
                headers: 
                   { 'Content-Type': 'application/json', ...(headers || {}) }
               };            
            fetch(this.extendUrl(url, parameters), args).then(response => {
                if (!response.ok) {
                    throw new Error('client.get failed for url ' + url + '. response: ' + response.text);
                }
                return response.json(); 
            })
            .then(data => {
                resolve(data);
            })
            .catch(error => {
                reject(error);
            });
        })
    }

    postJson(url, parameters, body, headers) {
        return new Promise((resolve, reject) => {
            let args = { method: 'POST', 
                         headers: 
                            { 'Content-Type': 'application/json', ...(headers || {}) },
                         body: JSON.stringify(body || {})
                        };
            fetch(this.extendUrl(url, parameters), args).then(response => {
                if (!response.ok) {
                    throw new Error('client.get failed for url ' + url + '. response: ' + response.text);
                }
                return response.json(); 
            })
            .then(data => {
                resolve(data);
            })
            .catch(error => {
                reject(error);
            });
        })
    }

    extendUrl(url, params) {
        url = this.replaceUrlPlaceholders(url, params);
        return this.addParameters(url, params);
    }

    replaceUrlPlaceholders(url, params) {
        return url.replace(/{(\w+)}/g, (match, key) => params[key] || match);
    }

    addParameters(url, paramsObj) {
        const urlHasParams = url.includes('?'); // Prüfen, ob die URL bereits Parameter enthält
        const newParams = this.objectToUrlParams(paramsObj);
    
        // Falls die URL schon Parameter hat, mit '&' erweitern, sonst mit '?'
        return urlHasParams ? `${url}&${newParams}` : `${url}?${newParams}`;
    }    

    
    objectToUrlParams(obj) {
        return Object.entries(obj || {})
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&');
    }
    
}


function constructRestClient() {
    return new RestClient();
}