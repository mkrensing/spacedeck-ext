import os
from functools import wraps
from flask import Flask
init_service_functions = []

def init_service(init_service_function):
    init_service_functions.append(init_service_function)

def init_services(app: Flask):
    for init_service_function in init_service_functions:
        init_service_function(app)

init_endpoint_functions = []

def init_endpoints(flask: Flask):
    with flask.app_context():
        for init_function in init_endpoint_functions:
            init_function()


def init_endpoint(init_function):
    init_endpoint_functions.append(init_function)

def inject_environment(environment_variables : {}):

    print("ENTER lookup_config")
    def wrapper(init_function):

        @wraps(init_function)
        def decorator(*args, **kwargs):
            environment_values = lookup_environment_variables(environment_variables)
            return init_function(*environment_values, **kwargs)
        return decorator
    return wrapper

def lookup_environment_variables(environment_variables : []) -> []:
    values = []
    for environment_variable_name in environment_variables:
        values.append(os.getenv(key=environment_variable_name, default=environment_variables[environment_variable_name]))

    return values


def lookup_file(relative_path: str) -> str:
    return os.path.abspath(relative_path)