class SVGBackgroundParser {

    constructor() {

    }

    extractBackgroundUrl(background) {

        let backgroundUrlMatch = background.match(/url\(\"(.*?)\"\)/);

        if (backgroundUrlMatch) {

            return backgroundUrlMatch[1];

        }

        return null;

    }



    parse(inkscapeSVGCallback) {

        let background = $('.wrapper').css('background-image');

        let url = this.extractBackgroundUrl(background);

        if (url) {

            $.get(url, function (content) {

                let svg = constructInkscapeSVG(content);

                inkscapeSVGCallback(svg);

            });

        } else {

            console.log("Kein Hintergrundbild gefunden");

        }

    }

}

function constructSVGBackgroundParser() {

    return new SVGBackgroundParser();

}