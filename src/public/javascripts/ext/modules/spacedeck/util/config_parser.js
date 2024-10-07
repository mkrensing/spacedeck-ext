class ConfigParser {

    constructor(defaultConfig) {

        this.defaultConfig = defaultConfig || {};
        this.boardConfigDescriptionPrefix = "CONFIG:"
    }

    extractConfigFromBoard() {

        let _this=this;
        let boardConfigArtifact = constructSpacedeckAdapter().findFirstMatchingArtifact(function(artifact) {
            return getArtifactDescription(artifact).startsWith(_this.boardConfigDescriptionPrefix);
        })

        if(!boardConfigArtifact) {
            return {};
        }

        let boardConfig = getArtifactDescription(boardConfigArtifact);
        boardConfig = boardConfig.replace(_this.boardConfigDescriptionPrefix, "").replaceAll("'", "\"");

        return JSON.parse(boardConfig);
    }

    extractConfigFromUrl() {

        return getURLParameters();
    }

    parse() {

        let configByBoard = this.extractConfigFromBoard();
        let configByUrl = this.extractConfigFromUrl();

        let mergedObjects = deepMergeObjects([ this.defaultConfig, configByBoard, configByUrl ]);
        return mergedObjects;

    }

}



function constructConfigParser(configByFile) {

    return new ConfigParser(configByFile);

}

function getURLParameters() {

    let result = {}
    let parameters = new URLSearchParams(window.location.search);
    let parameterNames = parameters.keys();

    for(let parameterName of parameters.keys()) {
        let parameterNameParser = parameterName.split(".");
        let key = parameterNameParser.slice(-1);

        let parameterPath = parameterNameParser.slice();
        parameterPath.pop();

        let currentObject = result;
        parameterPath.forEach(function(pathElement) {

            if(! currentObject[pathElement]) {
                currentObject[pathElement] = {}
            };

            currentObject = currentObject[pathElement];
        });

        currentObject[key] = parameters.getAll(parameterName);
        if(currentObject[key].length == 1) {
            currentObject[key] = currentObject[key][0];
        }
    };

    return result;

}



function deepMergeObjects(objects) {

    let targetObject = {};
    objects.forEach(function(object) {
        targetObject = deepMergeObject(targetObject, object);
    });

    return targetObject;

}



/**

 * This function will accept the two objects as arguments and return the object of deeply
 * merged with nested properties.
 * @param {object} targetObject objects containing the properties to be merged with source.
 * @param {object} sourceObject objects containing the properties you want to apply.
 * @return {object} return the deeply merged objects

 */
function deepMergeObject(targetObject = {}, sourceObject = {}) {

    // Iterating through all the keys of source object
    Object.keys(sourceObject).forEach((key) => {

        if (typeof sourceObject[key] === "object" && !Array.isArray(sourceObject[key])) {

            // If property has nested object, call the function recursively
            targetObject[key] = deepMergeObject(targetObject[key], sourceObject[key]);

        } else {

            // else merge the object source to target
            targetObject[key] = sourceObject[key];
        }

    });

    return targetObject;

}

