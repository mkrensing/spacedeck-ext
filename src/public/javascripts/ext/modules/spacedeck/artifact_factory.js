class ArtifactFactory {

    constructor() {

    }


    cloneArtifacts(artifactDefinitions, artifactClonedCallback) {

        let spacedeckAdapter = constructSpacedeckAdapter();
        let artifactDefinitionsForType = this.buildArtifactDefinitionsForType(artifactDefinitions);
        let templatesForType = this.buildTemplatesForTypes(Object.keys(artifactDefinitionsForType));

        for(let type in artifactDefinitionsForType) {
            if(templatesForType[type]) {
                spacedeckAdapter.cloneArtifacts(artifactDefinitionsForType[type], templatesForType[type], artifactClonedCallback);
            }
        }
    }


    buildArtifactDefinitionsForType(artifactDefinitions) {
        let index={};
        artifactDefinitions.forEach(function(artifactDefinition) {
            if(! index[artifactDefinition.type]) {
                index[artifactDefinition.type] = [];
            }
            index[artifactDefinition.type].push(artifactDefinition);
        })
        return index;
    }

    buildTemplatesForTypes(types) {
        let templateArtifacts={};
        let spacedeckAdapter = constructSpacedeckAdapter();
        types.forEach(function(type) {
            let templateText = "[Template:" + type + "]";
            let templateArtifact = spacedeckAdapter.findArtifactByText(templateText);
            if(templateArtifact) {
                templateArtifacts[type] = templateArtifact;
            } else {
                console.error("Template not found for Type", type, "Missing artifact with text: ", templateText);
            }
        });
        return templateArtifacts;
    }


   
}


function constructArtifactFactory() {
    return new ArtifactFactory();
}
