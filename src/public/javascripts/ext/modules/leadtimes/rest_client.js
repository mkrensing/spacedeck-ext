class RestClient {

    getJson(urlTemplate, parameters, headers) {
        return new Promise((resolve, reject) => {
            let args = { method: 'GET', 
                headers: 
                   { 'Content-Type': 'application/json', ...(headers || {}) }
               };            
            fetch(this.resolveUrlTemplate(urlTemplate, parameters), args).then(response => {
                if (!response.ok) {
                    return createErrorPromise(urlTemplate, response);
                } else {
                    return response.json(); 
                }
            })
            .then(data => {
                resolve(data);
            })
            .catch(error => {
                reject(error);
            });
        })
    }

    postJson(urlTemplate, parameters, body, headers) {
        return new Promise((resolve, reject) => {
            let args = { method: 'POST', 
                         headers: 
                            { 'Content-Type': 'application/json', ...(headers || {}) },
                         body: JSON.stringify(body || {})
                        };
            fetch(this.resolveUrlTemplate(urlTemplate, parameters), args).then(response => {
                if (!response.ok) {
                    return createErrorPromise(urlTemplate, response);
                } else {
                    return response.json(); 
                }
            })
            .then(data => {
                resolve(data);
            })
            .catch(error => {
                reject(error);
            });
        })
    }

    resolveUrlTemplate(originalUrl, originalParams) {
        const { url, params } = this.replaceUrlPlaceholders(originalUrl, originalParams);
        return this.addParameters(url, params);
    }

    replaceUrlPlaceholders(url, params) {
        const usedKeys = new Set(); // Set zum Speichern der verwendeten Parameter
        const updatedParams = { ...params }; // Kopiere params, um es nicht zu manipulieren
    
        const resultUrl = url.replace(/{(\w+)}/g, (match, key) => {
            if (params[key]) {
                usedKeys.add(key); // Speichere den ersetzten Parameter
                return params[key]; // Ersetze Platzhalter
            }
            return match; // Behalte den Platzhalter, falls kein Wert vorhanden ist
        });
    
        // Entferne alle verwendeten Parameter aus updatedParams
        usedKeys.forEach(key => delete updatedParams[key]);
    
        return { url: resultUrl, params: updatedParams };
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

function createErrorPromise(urlTemplate, response) {
    return new Promise((resolve, reject) => {
        return response.text().then(text => {
            reject({ error: {
                    urlTemplate: urlTemplate,
                    url: response.url,
                    status: response.status,
                    text: text
                }
            });                        
        });
    });
}



function constructRestClient() {
    return new RestClient();
}