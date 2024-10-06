class TaskboardColumn {

    constructor(svgElement, columnName, config) {

        this.svgElement = svgElement;
        this.columnName = columnName
        this.config = config;

        this.dimensions = this.svgElement.dimensions;
        this.id = this.svgElement.attr('inkscape:label').replaceAll(" ", "-");
        this.div = TaskboardColumn.createColumnDiv(this.id, this.dimensions);
        this.divSelector = '#' + this.id;
    }

    static createColumnDiv(id, dimensions) {

        return $('<div>', {
            id: id,
            class: 'column'

        }).css({
            top: dimensions.y + "px",
            left: dimensions.x + "px",
            width: dimensions.width + "px",
            height: dimensions.height + "px",
        });

    }

    render() {

        this.div.appendTo('.wrapper');
    }

    getDiv() {

        return this.div;
    }

    getDivSelector() {
        return this.divSelector;

    }

    contains(artifact) {

        return (artifact.x >= this.dimensions.x && artifact.x <= this.dimensions.x + this.dimensions.width) &&

            (artifact.y >= this.dimensions.y && artifact.y <= this.dimensions.y + this.dimensions.height);

    }

}


class Taskboard {

    constructor(inkscapeSVG, taskboardName, config) {

        this.taskboardName = taskboardName;
        this.config = config
        this.columns = this.createColumns(inkscapeSVG, taskboardName, config); // {id} of TaskboardColumn
        console.log("Taskboard created with columns", this.columns);
    }

    // ---- Construction and Rendering -----
    createColumns(inkscapeSVG, taskboardName, config) {

        let columns = {};
        let svgElements = inkscapeSVG.findElementsByAttribute('rect', 'inkscape:label', function (label) {
            return label.startsWith(taskboardName);
        });

        $(svgElements).each(function (index) {

            let columnName = this.attr('inkscape:label').split('_')[1];
            let column = new TaskboardColumn(this, columnName, config[columnName]);
            columns[column.id] = column;
        });

        return columns;
    }

    render() {
        this.renderColumns();
    }

    renderColumns() {

        for (let id in this.columns) {
            this.columns[id].render();
        }
    }

    getColumn(id) {
        return this.columns[id];
    }

    // ---- Reading Operations on Taskboard -----
    getColumns() {
        return this.findColumns(function (column) { return true; });
    }

    /**

     * @returns {[] of TaskboardColumn}

     */

    findColumns(callback) {

        let columns = [];

        for (let id in this.columns) {

            let column = this.columns[id];

            if (callback(column)) {
                columns.push(column);
            }

        }

        return columns;
    }



    /**

     * @returns {TaskboardColumn|null}

     */

    findColumnForArtifactByPosition(artifact) {

        for (let id in this.columns) {

            let column = this.columns[id];

            if (column.contains(artifact)) {

                return column;

            }

        }

        return null;

    }



    getIssuesForColumnIndex(issues) {

        let issuesForColumnIndex = {};

        issues.forEach(function (issue) {



        });

    }



}

function constructTaskboard(inkscapeSVG, taskboardName, config) {

    return new Taskboard(inkscapeSVG, taskboardName, config);

}



