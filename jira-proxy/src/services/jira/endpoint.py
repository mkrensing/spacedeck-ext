
from flask import request, Blueprint
from utils.flask_util import init_endpoint, inject_environment, lookup_file
from utils.jsonp import jsonp
from .client import JiraConfig, JiraContext

jira_endpoint = Blueprint('jira_endpoint', __name__, url_prefix='/jira')
jira_config = JiraConfig()


@init_endpoint
@inject_environment({ "JIRA_ENDPOINT_CONFIGFILE" : lookup_file("../../../config/jira-proxy.json") })
def init(jira_endpoint_configfile: str):
    # Umgebungsvariable -> /config/endpoint.json
    # Konfigurationsklasse mit Konfiguration befüllen
    print(f"init({jira_endpoint_configfile})")
    jira_config.init(jira_endpoint_configfile)


def jira_client() -> JiraContext:
    endpoint_id = request.args.get("endpoint_id")
    if not endpoint_id:
        raise Exception("Missing Parameter 'endpoint_id'")
    return jira_config.create_jira_client(endpoint_id)

@jira_endpoint.route('/test/<issue_id>')
@jsonp()
def get_test(issue_id):
    print(f"CALLED /test/{issue_id}")
    endpoint_id = request.args.get("endpoint_id")
    if not endpoint_id:
        raise Exception("Missing Parameter 'endpoint_id'")
    config = jira_config.get_endpoint_config(endpoint_id)
    config["JiraToken"] = "***"

    return { "test": issue_id, "config": config }


@jira_endpoint.route('/issue/<issue_id>')
@jsonp()
def get_issue(issue_id):
    print(f"CALLED /issue/{issue_id}")
    with jira_client() as jira:
        try:
            return jira.issue(issue_id).raw
        except Exception as e:
            raise Exception(f"get_issue({issue_id})", e)


@jira_endpoint.route('/search')
@jsonp()
def search():
    jql = request.args.get('jql')
    fields = request.args.get('fields')
    expand = request.args.get('expand')
    start_at = int(request.args.get('startAt', '0'))
    max_results = int(request.args.get('maxResults', '100'))

    print(f"CALLED /search jql={jql} fields={fields} expand={expand} start_at={start_at}, max_results={max_results}")
    with jira_client() as jira:
        try:
            return jira.search_issues(jql_str=jql, fields=fields, expand=expand, startAt=start_at, maxResults=max_results, json_result=True)
        except Exception as e:
            raise Exception(f"search({jql})", e)