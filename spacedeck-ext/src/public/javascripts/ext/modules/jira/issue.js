function lastChangeOfField(issue, fieldName, value) {

    let lastChange = this.getLastChangeOf(issue, function(changelogEntry) {
        return changelogEntry.field == fieldName && changelogEntry.value == value;
    });

    if(lastChange) {
        return getDiffInDays(lastChange.timestamp);
    }

    return 0;
}

function getDiffInDays(timestamp) {

    const date = new Date(timestamp);
    const now = new Date();

    const diffTime = Math.abs(now - date);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
}

function getLastChangeOf(issue, filter) {

    let history = [];
    this.searchHistory(issue, function(changelogEntry) {
        if(filter(changelogEntry)) {
            history.push(changelogEntry);
        }
    })

    if(history) {
        return history.pop();
    }

    return null;
}


function searchHistory(issue, callback) {

    issue.changelog.histories.forEach(function(historyEntry) {
        historyEntry.items.forEach(function(historyEntryItem) {

            callback({timestamp: historyEntry.created, field: historyEntryItem.field, value: historyEntryItem.toString  });
        });
    }); 
}