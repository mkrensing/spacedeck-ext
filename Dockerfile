FROM spacedeck-open

COPY src /spacedeck-jira
WORKDIR /spacedeck-jira
CMD ["node", "start.js"]
