class SpacedeckAdapter {

    constructor() {
        this.registerCallbacks();
        this.onBoardLoadedCallbacks = [];
        this.onArtifactDeleteCallbacks = [];
        this.onArtifactSavedCallbacks = [];
        this.onViewUpdateCallbacks = {};
        this.onZoomCallbacks = {};
        this.loadingPage = new LoadingPage();
    }

    onBoardLoaded(callback) {
        this.onBoardLoadedCallbacks.push(callback);
    }

    fireBoardLoaded() {
        this.onBoardLoadedCallbacks.forEach(function(callback) {
            callback();
        });
    }

    onArtifactDelete(callback) {
        this.onArtifactDeleteCallbacks.push(callback);
    }

    onArtifactSaved(callback) {
        this.onArtifactSavedCallbacks.push(callback);
    }

    onZoom(zoomMethods, callback) {
        if(zoomMethods.constructor !== Array) {
            zoomMethods = [ zoomMethods ];
        }
        let _this=this;
        zoomMethods.forEach(function(zoomMethod) {
            if(! _this.onZoomCallbacks[zoomMethod]) {
                _this.onZoomCallbacks[zoomMethod] = [];
            }
            _this.onZoomCallbacks[zoomMethod].push(callback);
        });

    }

    onViewUpdate(context, callback) {
        if(! this.onViewUpdateCallbacks[context]) {
            this.onViewUpdateCallbacks[context] = [];
        }
        this.onViewUpdateCallbacks[context].push(callback);
    }

    fireViewUpdate(context, data) {

        if(! context) {
            throw "Missing context in data: " + data;
        }
        data.context = context;
        this.sendViewUpdateToThisClient(data);
        this.sendViewUpdateToOtherClients(data);

    }

    sendViewUpdateToThisClient(data) {
       this.onViewUpdateCallbacks[data.context].forEach(function(callback) {
            callback(data);
        });
    }

    sendViewUpdateToOtherClients(data) {

        let msg = {
            "action": "cursor",
            "viewupdate_data": data,
            "x": 0,
            "y": 0,
            "name": "viewupdate",
            "id": "2d6bfd21-a370-4433-95fb-2eddd924362b"
        }

        window.spacedeck.websocket_send(msg);
    }

    updateViewModel(artifact) {
        window.spacedeck.update_board_artifact_viewmodel(artifact);
    }

    registerCallbacks() {
        let _this=this;

        let original_delete_artifact = delete_artifact;
        delete_artifact = function(artifact, on_success, on_error) {
            original_delete_artifact(artifact, on_success, on_error);
            _this.onArtifactDeleteCallbacks.forEach(function(callback) {
                callback(artifact);
            });
        }

        let original_save_artifact = save_artifact;
        save_artifact = function(artifact, on_success, on_error) {
            original_save_artifact(artifact, function (a, b) {
                _this.onArtifactSavedCallbacks.forEach(function(callback) {
                    callback(artifact);
                });
                if(on_success) {
                    on_success(a, b);
                }
            }, on_error);
        }

        let original_handle_user_cursor_update = window.spacedeck.handle_user_cursor_update;
        window.spacedeck.handle_user_cursor_update = function(msg) {
            if(msg.viewupdate_data) {
                let context = msg.viewupdate_data.context
                if(! context) {
                    throw "Missing context in data: " + msg.viewupdate_data;
                }
                if(_this.onViewUpdateCallbacks[context]) {
                    _this.onViewUpdateCallbacks[context].forEach(function(callback) {
                        callback(msg.viewupdate_data);
                    });
                }
            } else  {
                original_handle_user_cursor_update(msg);
            }
        }

        let zoomMethods = [
            "zoom_adjust_scroll",
            "zoom_in",
            "zoom_out",
            "zoom_to_cursor",
            "zoom_to_fit",
            "zoom_to_original",
            "zoom_to_point",
            "zoom_to_rect",
            "zoom_to_zone" ];

        zoomMethods.forEach(function(methodName) {

            let originalZoomMethod = window.spacedeck[methodName];
            window.spacedeck[methodName] = function() {
                originalZoomMethod.apply( window.spacedeck, arguments);
                if(_this.onZoomCallbacks[methodName]) {
                    _this.onZoomCallbacks[methodName].forEach(function(callback) {
                        callback(methodName);
                    });
                }
            }
        });

        window.spacedeck.draw_line = draw_line;

    }

    loading(callback) {
        this.loadingPage.show();
        try {
            return callback();
        } finally
        {
         this.loadingPage.hide();
        }
    }

    loadingStart() {
        this.loadingPage.show();
    }

    loadingStop() {
        this.loadingPage.hide();
    }

    getSpaceId() {
        return window.spacedeck.active_space._id;
    }

    findArtifactByTag(tagName, tagValue) {
        return this.findFirstMatchingArtifact(function(artifact) {
            return artifact.tags && artifact.tags[tagName] == tagValue
        });
    }

    findArtifactsByTag(tagName) {
        return this.findArtifacts(function(artifact) {
            return artifact.tags && artifact.tags[tagName];
        });
    }    

    findArtifactByText(text) {
        return this.findFirstMatchingArtifact(function(artifact) {
            return getArtifactDescription(artifact) == text;
        })
    }

    replaceText(artifact, text) {

        if(! artifact) {
            throw "replaceText: Artifact is null";
        }

        let artifactDiv = this.getArtifactDiv(artifact);
        let replacedText = artifact.description.replace($(artifact.description).text(), text);
        artifactDiv.hover(function() {
            artifactDiv.find('.text-column').html(artifact.description);
        }, function() {
            artifactDiv.find('.text-column').html(replacedText);
        });

        // Du hast 10 Sekunden Zeit das Spacedeck Artifact zu verändern ;-)
        window.setTimeout(function() {
            artifactDiv.off();
            artifactDiv.find('.text-column').html(replacedText);
        }, 10000);

        artifactDiv.find('.text-column').html(replacedText);
    }

    findArtifactById(artifactId) {
        return window.spacedeck.find_artifact_by_id(artifactId);
    }

    findFirstMatchingArtifact(callback) {
        for(let index in window.spacedeck.active_space_artifacts) {
            let artifact = window.spacedeck.active_space_artifacts[index];
            if(!callback || callback(artifact)) {
                return artifact;
            };
        }
        return null;
    }

    getAllArtifacts() {
        return window.spacedeck.active_space_artifacts;
    }

    getAllArtifactsIndexedBy(callback) {
        return this.buildIndex(this.getAllArtifacts(), callback);
    }

    getArtifactDiv(artifact){
        return $(this.getArtifactDivSelector(artifact));
    }

    getArtifactDivSelector(artifact) {
        return ".artifact[id='artifact-" + artifact._id + "']";
    }

    waitForArtifactDiv(artifact, callback) {

        this.waitForElement(this.getArtifactDivSelector(artifact), callback);
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

    findArtifacts(callback) {
        callback = callback || function(artifact) { return true };
        return window.spacedeck.active_space_artifacts.filter(artifact => callback(artifact));
    }

    decorateArtifacts(decoratorCallback, keyCallback) {

        if(! keyCallback) {
            keyCallback = function(decoration, index) {
                return index;
            }
        }

        let result={};
        for(let index in window.spacedeck.active_space_artifacts) {
            let artifact = window.spacedeck.active_space_artifacts[index];
            let decoration = decoratorCallback(artifact);
            if(decoration) {
                let key = keyCallback(decoration, index);
                if(key) {
                    result[key] = decoration;
                }
            }
        }
        return result;
    }

    saveArtifact(artifact, callback) {
        window.spacedeck.save_artifact(artifact, function(artifact) {
            if(callback) {
                callback(artifact);
            }
        });
    }

    deleteArtifact(artifact, callback) {
        let $scope = window.spacedeck.$root;
        let _this=this;
        delete_artifact(artifact, function() {

            $scope.begin_transaction();
            let idx = window.spacedeck.active_space_artifacts.indexOf(artifact);
            window.spacedeck.active_space_artifacts.splice(idx, 1);
            $scope.end_transaction();

            callback();

        }, function() {
            console.error("delete_artifact.on_error");
        });


    }

    deleteArtifacts(artifacts, callback) {
        let _this=this;
        let deleted=0;
        let count = Object.keys(artifacts).length;
        console.log("deleteArtifacts", count);
        for(let index in artifacts) {
            this.deleteArtifact(artifacts[index], function() {
                deleted++;
                if(deleted >= count) {
                    console.log("deleteArtifacts finsished", deleted, count);
                    callback();
                }
            });
        }
    }

    /**
     *
     * @param artifactDefinitions: [{ description: '', x: 0, y: 0}]
     * @param templateArtifact spacedeck.Artifact
     * @param artifactsClonedCallback function(clonedArtifact)
     */
    cloneArtifacts(artifactDefinitions, templateArtifact, artifactsClonedCallback) {

        let template = new ArtifactTemplate(templateArtifact);
        let clonedArtifacts = [];

        artifactDefinitions.forEach(function(artifactDefinition, index) {

            template.clone(artifactDefinition, function(clonedArtifact) {
                clonedArtifacts.push(clonedArtifact);
                if(clonedArtifacts.length == artifactDefinitions.length) {
                    artifactsClonedCallback(clonedArtifacts);
                }
            });

        });
    }

    drawLine(id, classes, line) {
        return window.spacedeck.draw_line(id, classes, line);
    }

    convertColorToHex(color) {
        if(color.startsWith("#")) {
            return color;
        }

        return this.convertRGBAToHexA(color, true);
    }

    convertRGBAToHexA(rgba, forceRemoveAlpha = false) {
        return "#" + rgba.replace(/^rgba?\(|\s+|\)$/g, '') // Get's rgba / rgb string values
            .split(',') // splits them at ","
            .filter((string, index) => !forceRemoveAlpha || index !== 3)
            .map(string => parseFloat(string)) // Converts them to numbers
            .map((number, index) => index === 3 ? Math.round(number * 255) : number) // Converts alpha to 255 number
            .map(number => number.toString(16)) // Converts numbers to hex
            .map(string => string.length === 1 ? "0" + string : string) // Adds 0 when length of one number is 1
            .join("") // Puts the array to togehter to a string
    }

    buildIndex(items, keyCallback) {
        let index={}
        items.forEach(function(item) {
            let key = keyCallback(item);
            if(key) {
                index[key] = item;
            }
        });
        return index;
    }    
}

function draw_line(id, classes, line) {

    let start = line.start;
    let end = line.end;
    let zIndex = line.zIndex;

    let $scope = window.spacedeck.$root;
    if(zIndex < 0) {
        zIndex = $scope.highest_z()+1;
    }

    let left = Math.min(start.x, end.x);
    let top = Math.min(start.y, end.y);

    let width = Math.abs(end.x - start.x);
    let height = Math.abs(end.y - start.y);

    let controlPoint1 = { x: 0, y: 0};
    let controlPoint2 = { x: width, y: height };
    if(end.y - start.y < 0) {
        controlPoint1.y = height;
        controlPoint2.y = 0
    }
    if(end.x - start.x < 0) {
        controlPoint1.x = width;
        controlPoint2.x = 0;
    }


    let artifact = {
        space_id: $scope.active_space._id,
        id: id,
        mime: "x-spacedeck/vector",
        description: "",
        control_points: [{dx:controlPoint1.x,dy:controlPoint1.y},{dx:controlPoint2.x,dy:controlPoint2.y}],
        x: left,
        y: top,
        z: zIndex,
        w: width,
        h: height,
        stroke_color: "#000000",
        stroke: 2,
        shape: "line"
    };

    let artifactDiv = createArtifactDiv(artifact, { id: id, class: 'artifact artifact-vector x-spacedeck-vector ' + classes.join(" ") },function() {
        return $(window.spacedeck.artifact_vector_svg(artifact));
    });

    let existingDiv = $('#' + id);
    if(existingDiv.length == 0) {
        $('.wrapper').append(artifactDiv);
    } else {
        existingDiv.replaceWith(artifactDiv);
    }

    return artifactDiv;
}

function createArtifactDiv(artifact, attributes, contentCallback) {

    let artifactDiv = $('<div>', attributes).css({
        left: artifact.x,
        top: artifact.y,
        width: artifact.w,
        height: artifact.h,
        'z-index': artifact.z,
        overflow: 'visible'
    });


    let innerDiv = $('<div>').css({
        width: "100%",
        height: "100%"
    });

    let clipDiv = $('<div>', {class: 'clip', style: ''});
    let svgContainer = $('<div>');

    if(contentCallback) {
        svgContainer.append(contentCallback());
    }

    clipDiv.append(svgContainer);
    innerDiv.append(clipDiv);
    artifactDiv.append(innerDiv);

    return artifactDiv;
}

class ProxyCreator {

    constructor(target, forceProxyCreating) {
        this.target = target;
        this.forceProxyCreating = forceProxyCreating;
    }

    createProxy(configuration) {
        configuration["proxy"] = true;
        let target=this.target;
        if(target.proxy) {
            if(! this.forceProxyCreating) {
                return target;
            }

            target = Object.assign({}, target);
            console.error("proxy removed ", target);
        }

        return new Proxy(target, {
            get(target, prop, receiver) {
                if(configuration[prop]) {
                    return configuration[prop];
                }
                return target[prop];
            }
        });
    }
}

class ArtifactTemplate {

    constructor(templateArtifact) {
        this.templateText = getArtifactDescription(templateArtifact);
        this.templateArtifact = templateArtifact;
    }

    clone(artifactDefinition, callback) {
        let artifactProxy =  new ProxyCreator(this.templateArtifact).createProxy({
            description: this.extractDescription(artifactDefinition),
            tags: this.extractTags(artifactDefinition),
            x: artifactDefinition.x,
            y: artifactDefinition.y,

        });

        window.spacedeck.clone_artifact(artifactProxy, 0, 0, callback );
    }

    extractDescription(artifactDefinition) {
        return this.templateArtifact.description.replace(this.templateText, artifactDefinition.description);
    }

    extractTags(artifactDefinition) {
        if(artifactDefinition.tags) {
            return artifactDefinition.tags;
        }

        return {};
    }

}

class LoadingPage {

    constructor() {
        let content = '<div class="modal" >'+
            '    <div class="modal-wrapper">'+
            '        <div class="modal-dialog">'+
            '            <div class="modal-content loading-content" >'+
            '                <div class="modal-header" style="padding-bottom:0">'+
            '                    <h3 class="text-left">Loading...</h3>'+
            '                </div>'+
            '                <div class="modal-body" ><div class="loading-container" ><div class="loading" ></div></div></div>'+
            '            </div>'+
            '        </div>'+
            '    </div>'+
            '</div>';

        if($('.loading-page').length == 0) {
            this.loadingDiv = $('<div>', {class: 'loading-page' });
            this.loadingDiv.append(content);
            $('#main').prepend(this.loadingDiv);
        } else {
            this.loadingDiv = $('.loading-page');
        }
    }

    show() {
        this.loadingDiv.show();
    }

    hide() {
        this.loadingDiv.hide();
    }
}

function constructProxyCreator(target, forceProxyCreation) {
    return new ProxyCreator(target, forceProxyCreation);
}

let spacedeckAdapter = new SpacedeckAdapter();
function constructSpacedeckAdapter() {
    return spacedeckAdapter;
}

/*
 * Example:  batch('.artifact', function(artifact) { console.log(artifact) });
 */
function batch(jquerySelector, callback) {

    let spacedeckAdapter = constructSpacedeckAdapter();
    let _this=this;
    let changed=[];
    $(jquerySelector).each(function() {
        let artifactDiv=$(this).closest('.artifact');
        let artifactIdParser = artifactDiv.attr('id').split('artifact-');
        if(artifactIdParser.length > 1) {
            let artifactId = artifactIdParser[1];
            let artifact = spacedeckAdapter.findArtifactById(artifactId);
            if (artifact) {
                artifact = callback(artifact);
                if (artifact) {
                    spacedeckAdapter.saveArtifact(artifact);
                    changed.push(artifactId);
                }
            }
        }
    });

    return changed;
}

function getArtifactDescription(artifact) {
    return $("<p>" + artifact.description + "</p>").text();
}