from flask import Flask 
from services.jira.endpoint import jira_endpoint
from utils.flask_util import init_endpoints

app = Flask(__name__)
app.register_blueprint(jira_endpoint)

if __name__ == '__main__':

    init_endpoints(app)
    app.run(host='0.0.0.0', port=8888, debug=False, use_debugger=False, use_reloader=False, passthrough_errors=True)