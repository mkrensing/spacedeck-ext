class GridAlign {

    constructor(targetSelector) {
        this.containerClass = "grid_container";
        this.gridOverlapClass = "grid_overlap";
        this.gridItemClass = "grid_item";
        this.targetSelector = targetSelector;
        this.targetElement = $(this.targetSelector)[0];
        if(! this.targetElement) {
            console.error("targetElement not found for selector", this.targetSelector);
            throw "targetElement not found for selector "  + this.targetSelector;
        }
        this.targetSelectorRect = this.getAbsoluteRect(this.targetElement);
        // console.log("targetSelectorRect", this.targetSelectorRect);
    }

    createContainerDiv() {
        return $('<div>', {
            class: this.containerClass
        }).append($('<div>', { class: this.gridOverlapClass }));
    }

    createPositionMarkerDiv(position) {
        return $('<div>', {
            class: this.gridItemClass
        }).css({
            width: "200px",
            height: "100px",
        });
    }

    arrangeArtifact(artifact, positionMarkerDiv) {
        let absolutePosition = this.getAbsolutePositionInContainer(positionMarkerDiv);
        // console.log("arrangeArtifact to", absolutePosition);
        artifact.x = absolutePosition.left;
        artifact.y =  absolutePosition.top;
    }

    getAbsoluteRect(element) {
        let _this=this;
        return this.withVisibleElement(element, function(element) {
            let absolutePosition = _this.getAbsolutePosition(element);
            return {
                top: absolutePosition.top,
                left: absolutePosition.left,
                width: element.offsetWidth,
                height: element.offsetHeight
            }
        });
    }

    withVisibleElement(element, callback) {
        if(! $(element).is(":visible")) {
            $(element).show();
            let result = callback(element);
            $(element).hide();
            return result;
        } else {
            return callback(element);
        }
    }

    getAbsolutePosition(element) {
        var top = 0, left = 0;
        do {
            top += element.offsetTop  || 0;
            left += element.offsetLeft || 0;
            element = element.offsetParent;
        } while(element);

        return {
            top: top,
            left: left
        };
    };

    getAbsolutePositionInContainer(positionMarkerDiv) {
        let positionMarkerRect = this.getAbsoluteRect(positionMarkerDiv[0]);
        let itemPosition= { top: positionMarkerRect.top, left: positionMarkerRect.left };

        let itemMarginTop = parseInt(positionMarkerDiv.css('marginTop'));
        let itemHeight = parseInt(positionMarkerDiv.css('height'));

        if(positionMarkerRect.top + positionMarkerRect.height > this.targetSelectorRect.top + this.targetSelectorRect.height) {

            let overlap = (positionMarkerRect.top + positionMarkerRect.height) - (this.targetSelectorRect.top + this.targetSelectorRect.height);
            // - itemMarginTop*2
            let overlapInRowcount =  Math.ceil(overlap / (itemHeight + itemMarginTop*2));

            itemPosition.top = (this.targetSelectorRect.top + this.targetSelectorRect.height) - positionMarkerRect.height + (overlapInRowcount * this.overlapMargin.top);
            itemPosition.left = itemPosition.left + (overlapInRowcount * this.overlapMargin.left);
        }

        return itemPosition;
    }

    createContainer() {
        let containerDiv = this.createContainerDiv();
        let overlapDiv = containerDiv.children('.' + this.gridOverlapClass);

        $(this.targetSelector).append(containerDiv);
        this.containerY=parseInt(containerDiv.offset().top) + parseInt(containerDiv.css('height'));
        this.overlapMargin = { top: parseInt(overlapDiv.css('marginTop')), left:  parseInt(overlapDiv.css('marginLeft'))};

        return containerDiv;
    }

    arrange(artifacts) {
        let columnDiv = $(this.targetSelector)[0];
        let _this=this;
        return this.withVisibleElement(columnDiv, function(element) {
            return _this.__arrange_internal(artifacts);
        });
    }

    __arrange_internal(artifacts) {

        let _this=this;
        let containerDiv = this.createContainer();

        // render position marker
        let positionMarkers=[];
        artifacts.forEach(function(artifact, index) {
            let positionMarkerDiv = _this.createPositionMarkerDiv(index);
            containerDiv.append(positionMarkerDiv);
            positionMarkers.push(positionMarkerDiv);
        });

        // adjust postion marker size
        artifacts.forEach(function(artifact, index) {
            let positionMarkerDiv = positionMarkers[index];
            positionMarkerDiv.css('width', artifact.width);
            positionMarkerDiv.css('height', artifact.height);
        });

        // arrange artifacts
        artifacts.forEach(function(artifact, index) {
            let positionMarkerDiv = positionMarkers[index];
            _this.arrangeArtifact(artifact, positionMarkerDiv);
        });

        // remove container
        containerDiv.remove();
    }
}

function constructGridAlign(targetSelector) {
    return new GridAlign(targetSelector);
}
