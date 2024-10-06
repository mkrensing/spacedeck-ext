class ExtensionPoint {

    constructor() {
        console.log("Loading Extension Point");
        this.spaceLoadedCallbacks = [];
        this.stylesheetLocation = "/stylesheets/ext/";
        this.scriptLocation = "/javascripts/ext/";
        this.loadingInProgress=false;
    }

    init() {
        let _this=this;
        let original_load_space = load_space;
        load_space = function(id, on_success, on_error) {
            original_load_space(id, function(space, role) {
                _this.fireSpaceLoaded();
                on_success(space, role);
            }, function(xhr) {
                console.error("Extension Point. Error in load_space", xhr);
                on_error(xhr);
            });
        }
    }
    fireSpaceLoaded(on_success) {
        if(this.loadingInProgress) {
            let _this=this;
            window.setTimeout(function() {
                _this.loadingInProgress=false;
            }, 250);
            return;
        }
        this.loadingInProgress=true;
        let parent=this;
        this.waitForElement("#space", function() {
            for(let index in parent.spaceLoadedCallbacks) {
                let callback = parent.spaceLoadedCallbacks[index];
                callback();
            }
        });
    }

    onSpaceLoaded(callback) {
        this.spaceLoadedCallbacks.push(callback);
    }

    loadStylesheets(fileName) {
        console.log("Loading Stylesheet", fileName);
        $("<link/>", {
            rel: "stylesheet",
            type: "text/css",
            href: this.stylesheetLocation + fileName
        }).appendTo("head");
    }

    load(scriptNames, callback) {
        if(scriptNames.constructor !== Array) {
            scriptNames = [ scriptNames ];
        }
        this.getScripts(scriptNames, callback);
    }

    patch(functionSelector, patchFunction) {
        this.waitForFunction(functionSelector, function() {
            let originalFunction = functionSelector();
            patchFunction(originalFunction);
        });
    }

    waitForFunction(functionSelector, callback, retries=50) {
        let _this=this;
        if(retries <= 0) {
            throw "Timeout while waiting for function";
        }
        if (functionSelector()) {
            callback();
        } else {
            setTimeout(function() {
                _this.waitForElement(functionSelector, callback, --retries);
            }, 100);
        }
    };

    getScripts(scripts, callback) {
        let parent=this;
        let progress = 0;
        scripts.forEach(function(script) {
            $.getScript(parent.scriptLocation + script, function () {
                console.log("Loaded", script);
                if (++progress == scripts.length) callback();
            });
        });
    }

    getScripts2 = function(scripts, callback) {
        let parent=this;
        let progress = 0;
        let _arr = $.map(scripts, function(script) {
            return $.getScript( parent.scriptLocation + script, function() {
                console.log("Loaded", script);
                if (++progress == scripts.length) callback();
            });
        });
        _arr.push($.Deferred(function( deferred ){
            $( deferred.resolve );
        }));
        return $.when.apply($, _arr);
    }

    waitForElement(selector, callback, retries=50) {
        let _this=this;
        if(retries <= 0) {
            throw "Timeout while waiting for element: " + selector;
        }
        if ($(selector).length) {
            callback();
        } else {
            setTimeout(function() {
                _this.waitForElement(selector, callback, --retries);
            }, 100);
        }
    };

    waitForElementDeleted(selector, callback, retries=50) {
        let _this=this;
        if(retries <= 0) {
            throw "Timeout while waiting for element deleted: " + selector;
        }
        if ($(selector).length == 0) {
            callback();
        } else {
            setTimeout(function() {
                _this.waitForElementDeleted(selector, callback, --retries);
            }, 100);
        }
    };
}

class SpacedeckModule {

    constructor(prefix, moduleName) {
        this.modulePath = prefix + "/" + moduleName;
        this.moduleName = moduleName;
        this.scripts=[];
        this.submodules=[];
    }

    loadStylesheets(stylesheetFileName) {
        spacedeckExtensionPoint.loadStylesheets(this.modulePath + "/" + stylesheetFileName);
    }

    loadGlobalStylesheets(stylesheetFileName) {
        spacedeckExtensionPoint.loadStylesheets(stylesheetFileName);
    }

    requiresGlobal(scriptName) {
        this.scripts.push(scriptName);
    }

    requires(scriptName) {
        this.scripts.push(this.modulePath + "/" + scriptName);
    }

    ready(callback) {
        let scripts = this.getAllScripts();
        if(scripts.length > 0) {
            spacedeckExtensionPoint.getScripts(scripts, callback);
        } else {
            callback();            
        }
        
    }

    use(moduleName) {
        let submodule = constructSpacedeckModule(moduleName);
        this.submodules.push(submodule);
        return submodule;
    }

    getAllScripts() {
        let allScripts=[].concat(this.scripts);
        this.submodules.forEach(function(module) {
            allScripts = allScripts.concat(module.getAllScripts());
        });
        return allScripts;
    }
}
function constructSpacedeckModule(moduleName) {
    return new SpacedeckModule("modules", moduleName);
}
function constructSpacedeckBoard(moduleName) {
    return new SpacedeckModule("boards", moduleName);
}

let spacedeckExtensionPoint = new ExtensionPoint();

spacedeckExtensionPoint.onSpaceLoaded(function() {
    var allTextCells = $('.artifact .text-cell .text-column').not('.text-editing').find('p');
    $(allTextCells).each(function(index, item) {
        var text = $(item).text();
        if(text.startsWith("[Config:")) {
            var scriptNameMatch = text.match(/\[Config:(.*?)\]/);
            var scriptName = "config/" + scriptNameMatch[1];
            spacedeckExtensionPoint.load(scriptName, function() {});
        }   
    });

    $(allTextCells).each(function(index, item) {
        var text = $(item).text();
        if(text.startsWith("[Script:")) {
            var scriptNameMatch = text.match(/\[Script:(.*?)\]/);
            var scriptName = scriptNameMatch[1];
            spacedeckExtensionPoint.load(scriptName, function() {});
        }

     
    });
});

spacedeckExtensionPoint.patch(function() { return window.spacedeck?.artifact_major_type }, function(original_artifact_major_type) {
    window.spacedeck.artifact_major_type = function(a) {
        if (!a.mime) {
            console.error("Artifact without mime :-(", a);
            a.mime = "shape";
        }
        return original_artifact_major_type(a);
    }
});

spacedeckExtensionPoint.init();
