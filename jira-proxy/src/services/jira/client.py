from jira import JIRA
import json


class JiraContext:

    def __init__(self, target_host, username, token):
        self.target_host = target_host
        self.username = username
        self.token = token
        self.jira_client = None

    def __enter__(self):
        self.jira_client = JIRA(server=self.target_host, options={"verify": True}, basic_auth=(self.username, self.token), validate=False)
        return self.jira_client

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.jira_client.close()


class JiraConfig:

    def __init__(self):
        self.config = None

    def init(self, filename: str):
        with open(filename) as file:
            self.config = json.load(file)

    def get_endpoint_config(self, endpoint_id) -> dict:
        return self.config[endpoint_id]

    def create_jira_client(self, endpoint_id) -> JiraContext:
        config = self.get_endpoint_config(endpoint_id)
        target_host = config['JiraEndpoint']
        username = config['JiraUsername']
        token = config['JiraToken']
        return JiraContext(target_host, username, token)


