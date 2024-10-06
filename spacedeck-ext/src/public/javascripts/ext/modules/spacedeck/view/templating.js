class Template {

    constructor(templateFileName, templateUrl) {
        this.templateName = this.extractTemplateName(templateFileName);
        this.templateId = this.extractTemplateId(templateFileName);
        this.templateUrl = templateUrl;
    }

    load(callback) {
        $('head').append("<script id='" + this.templateId + "' type='x-tmpl-mustache'></script>");
        $('#' + this.templateId).load(this.templateUrl, "", callback); 
    }

    extractTemplateName(fileName) {
        return fileName.split(".")[0];
    }    

    extractTemplateId(fileName) {
        return this.extractTemplateName(fileName) + "-template";
    }    

    render(data) {
        let template = document.getElementById(this.templateId).innerHTML;

        data.converter = {};
        data.converter.isoDate = function() {
            return function(text, render) {
                try {
                    return new Date(render(text)).toISOString().substring(0, 10);
                } catch(e) {
                    return "";
                }
                
            }
        }

        return mustache.render(template, data);
    }

    getName() {
        return this.templateName;
    }
}

class TemplateLoader {

    constructor(pathPrefix) {
        this.templateLocation = "/stylesheets/ext/";
        this.pathPrefix = pathPrefix || "";
    }

    load(templateFileNames, callback) {
        let progress = 0;
        let _this=this;
        if(templateFileNames.constructor !== Array) {
            templateFileNames = [ templateFileNames ];
        }

        let templateIndex = {};
        templateFileNames.forEach(function(templateFileName) {
            
            let template = _this.createTemplate(templateFileName);
            templateIndex[templateFileName] = template;

            template.load(function() {

                if (++progress == templateFileNames.length) {
                    let templates = [];
                    templateFileNames.forEach(function(templateFileName) {
                        templates.push(templateIndex[templateFileName]);
                    });
                    callback(...templates);
                }
            });
        });
    }

    /**
     * @param targetSelector
     * @param templateId
     * @returns {Template}
     */
    createTemplate(templateFileName) {
        let templateUrl = this.getTemplateUrl(templateFileName);
        return new Template(templateFileName, templateUrl);
    }

    getTemplateUrl(templateFileName) {
        return this.templateLocation + this.pathPrefix + templateFileName;
    }

}

function constructTemplateLoader(pathPrefix) {
    return new TemplateLoader(pathPrefix);
}
