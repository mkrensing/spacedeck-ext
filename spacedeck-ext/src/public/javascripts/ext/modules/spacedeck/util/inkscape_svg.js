class SVGTransformation {



    constructor(content) {

        this.element = $(content);

        this.transformX = 0;

        this.transformY = 0;

        this.parseTransformStatement();

    }



    parseTransformStatement() {

        let transformStatement = this.element.attr('transform');

        if (!transformStatement) {

            return;

        }

        let transformMatch = transformStatement.match(/translate\(([0-9.]*),([0-9.]*)\)/);

        if (!transformMatch) {

            return;

        }

        this.transformX = parseInt(transformMatch[1]);

        this.transformY = parseInt(transformMatch[2]);

    }



    transformDimensions(dimensions) {

        return { x: dimensions.x + this.transformX, y: dimensions.y + this.transformY, width: dimensions.width, height: dimensions.height };

    }

}



class SVGLayer {



    constructor(content) {

        this.content = content;

        this.svg = $(content);

        this.transformation = new SVGTransformation(content);

    }



    findElements(tagName, svgElementFilterCallback) {

        let elements = this.svg.find(tagName);

        let result = [];

        let layer = this;

        elements.each(function (index, element) {

            let svgElement = new SVGElement(element, layer);

            if (svgElementFilterCallback(svgElement)) {

                result.push(svgElement);

            }

        });



        return result;

    }



    findFirstElement(tagName, svgElementFilterCallback) {

        let elements = this.findElements(tagName, svgElementFilterCallback);



        if (elements) {

            return elements[0];

        }



        return null;

    }



    findElementsByAttribute(tagName, inkscapeAttributeName, inkscapeAttributeFilter) {

        let result = [];

        let elements = this.findObjectsByAttribute(tagName, inkscapeAttributeName, inkscapeAttributeFilter);

        let layer = this;

        elements.each(function (index, item) {

            result.push(new SVGElement(item, layer));

        });

        return result;

    }



    findFirstElementByAttribute(tagName, inkscapeAttributeName, inkscapeAttributeFilter) {

        let elements = this.findObjectsByAttribute(tagName, inkscapeAttributeName, inkscapeAttributeFilter);

        let layer = this;

        if (elements) {

            return new SVGElement(elements[0], layer)

        }



        return null;

    }



    findObjectsByAttribute(tagName, inkscapeAttributeName, inkscapeAttributeFilter) {

        return this.svg.find(tagName).filter(function () {

            let attributeValue = $(this).attr(inkscapeAttributeName);

            return attributeValue && inkscapeAttributeFilter(attributeValue);

        });

    }



    transformDimensions(dimensions) {

        return this.transformation.transformDimensions(dimensions);

    }

}



class SVGElement {



    constructor(content, layer) {

        this.content = content;

        this.svg = $(content);

        this.layer = layer;

        this.transformation = new SVGTransformation(content);

        this.dimensions = this.createDimensions();

    }



    attr(attributeName, attributeValue) {

        if (attributeValue) {

            this.svg.attr(attributeName, attributeValue);

        } else {

            return this.svg.attr(attributeName);

        }

    }



    getId() {

        return this.attr("id");

    }



    getLabel() {

        return this.attr('inkscape:label');

    }



    getDescription() {

        return this.svg.children("desc").text();

    }



    getTitle() {

        return this.svg.children("title").text();

    }



    createDimensions() {

        return this.transformation.transformDimensions(this.layer.transformDimensions(

            {

                x: parseInt(this.attr('x')),

                y: parseInt(this.attr('y')),

                width: parseInt(this.attr('width')),

                height: parseInt(this.attr('height'))

            }));

    }



    /**

     * Überträgt das SVGElement auf den DOM

     *

     * @param domSelector

     * @param stylesheetClassNames

     * @returns {*}

     */

    extract(domSelector, stylesheetClassNames) {



        let domElement = $('<div>', {

            id: this.attr('id'),

            class: stylesheetClassNames || ''



        }).css({

            position: 'absolute',

            top: this.dimensions.y + "px",

            left: this.dimensions.x + "px",

            width: this.dimensions.width + "px",

            height: this.dimensions.height + "px",

        });



        let copyAttributes = { "description": this.getDescription, "label": this.getLabel, "title": this.getTitle };

        for (let attributeName in copyAttributes) {

            let attributeValue = copyAttributes[attributeName].apply(this, {});

            if (attributeValue) {

                domElement.attr(attributeName, attributeValue);

            }

        }



        $(domSelector).append(domElement);



        // convert von jquery Element to DomElement

        return domElement[0];

    }



    extractImage(domSelector, stylesheetClassNames) {



        let imageData = this.attr('xlink:href');



        let domElement = $('<img>', {

            id: this.attr('id'),

            class: stylesheetClassNames || '',

            src: imageData

        }).css({

            position: 'absolute',

            top: this.dimensions.y + "px",

            left: this.dimensions.x + "px",

            width: this.dimensions.width + "px",

            height: this.dimensions.height + "px",

        });



        $(domSelector).append(domElement);

    }



    /**

     * TODO: Aktuell wird das SVG Element als DIV übertragen. Wenn das komplette Layout übernommen werden soll muss es als SVG + SVG-Element (z.B. rect) übertragen werden. Dann kann

     * es auch den kompletten Style übernehmen und die MEthode ist hinfällig. Alternativ müsste der Style pro Element-Typ übernommen werden. Bei Rect z.B. fill->background-color, bei Text nicht :-(

      * @type {Aktuell}

     */

    convertStyle(svgStyle) {



        let converters = { "fill": "background-color" };

        let styles = this.listToDict(svgStyle);

        let result = "";



        for (let attributeName in converters) {

            if (styles[attributeName]) {

                result += converters[attributeName] + ": " + styles[attributeName] + ";";

            }

        }



        return result;

    }



    listToDict(style) {

        let styleDict = {};

        let attributePairs = style.split(";");

        attributePairs.forEach(function (attributePair) {

            let nameAndValue = attributePair.split(/[=:]+/);

            styleDict[nameAndValue[0]] = nameAndValue[1];

        });

        return styleDict;

    }





}



class InkscapeSVG {



    constructor(content) {

        this.content = content;

        this.svg = $(content);

    }



    /*

    return [] of SVGLayer

 */

    findLayers() {

        let layerObjects = this.findObjectsByAttribute("g", "inkscape:groupmode", function (attributeValue) { return attributeValue == "layer" });

        let layers = [];

        layerObjects.each(function (index, layerItem) {

            layers.push(new SVGLayer(layerItem));

        });



        return layers;

    }



    /*

        return [] of SVGElement

     */

    findElementsByAttribute(tagName, inkscapeAttributeName, inkscapeAttributeFilter) {



        let result = [];

        let layers = this.findLayers();

        $(layers).each(function (index, layer) {

            result = result.concat(layer.findElementsByAttribute(tagName, inkscapeAttributeName, inkscapeAttributeFilter));

        });



        return result;

    }



    /*

        return [] of SVGElement

     */

    findElements(tagName, svgElementFilterCallback) {



        let result = [];

        let layers = this.findLayers();

        $(layers).each(function (index, layer) {

            result = result.concat(layer.findElements(tagName, svgElementFilterCallback));

        });



        return result;

    }



    /*

        return [] of SVGElement

     */

    findFirstElement(tagName, svgElementFilterCallback) {



        let layers = this.findLayers();

        $(layers).each(function (index, layer) {

            let element = layer.findFirstElement(tagName, svgElementFilterCallback);

            if (element) {

                return element;

            }

        });



        return null;

    }



    /*

        return SVGElement or null

    */

    findFirstElementByAttribute(tagName, inkscapeAttributeName, inkscapeAttributeFilter) {

        let result = this.findElementsByAttribute(tagName, inkscapeAttributeName, inkscapeAttributeFilter);

        if (result) {

            return result[0];

        }

        return null;

    }



    findObjectsByAttribute(tagName, attributeName, attributeFilter) {

        return this.svg.find(tagName).filter(function () {

            let attributeValue = $(this).attr(attributeName);

            return attributeValue && attributeFilter(attributeValue);

        });

    }



    findElementsByLabel(label) {

        return this.findElementsByAttribute("*", "inkscape:label", function (attributeValue) { return label == attributeValue });

    }



    findFirstElementByLabel(label) {

        return this.findFirstElementByAttribute("*", "inkscape:label", function (attributeValue) { return label == attributeValue });

    }



    findFirstElementById(id) {

        return this.findFirstElementByAttribute("*", "id", function (elementLabel) { return id == attributeValue });

    }



}



function constructInkscapeSVG(content) {

    return new InkscapeSVG(content);

}

