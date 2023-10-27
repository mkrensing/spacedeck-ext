FROM python:latest
COPY requirements.txt /requirements.txt
RUN pip install -r /requirements.txt
RUN mkdir /config
COPY entrypoint.sh /entrypoint.sh
COPY src /opt/jira_proxy

EXPOSE 8080

ENTRYPOINT [ "/bin/bash" ]
CMD [ "/entrypoint.sh" ]