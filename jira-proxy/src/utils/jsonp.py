from functools import wraps
from flask import request, Response
import traceback
import json

def jsonp():

    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            return to_jsonp(lambda : fn(*args, **kwargs))
        return decorator

    return wrapper

def to_jsonp(callback):
    try:
        return response_jsonp(callback())
    except Exception as e:
        print(traceback.format_exc())
        return response_jsonp_error(400, e)

def response_jsonp(json_payload):
    callback_function_name = request.args.get('callback', 'jsonp_callback')        
    jsonp_payload = f"{callback_function_name}({json.dumps(json_payload)})"

    response = Response(jsonp_payload.encode(encoding='utf-8'), mimetype='application/javascript')
    response.headers["Content-Type"] = "application/javascript; charset=utf-8"

    return response 

def response_jsonp_error(error_code: int, exception):
    json_payload = { "error" : str(exception), "error_code": error_code }  

    return response_jsonp(json_payload) 