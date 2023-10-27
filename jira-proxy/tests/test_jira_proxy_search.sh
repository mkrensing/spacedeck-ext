#!/bin/bash
# Rest-API Doku: https://developer.atlassian.com/cloud/jira/platform/rest/v3/intro/
# Dokumenation zu basic-auth: https://developer.atlassian.com/cloud/jira/platform/basic-auth-for-rest-apis/
# Erzeugung von Tokens: https://id.atlassian.com/manage-profile/security/api-tokens
USERNAME=info@krensing.com
API_TOKEN="ATATT3xFfGF0bgDl-pKfH2HV38yJLdDAh-kRWygKvqMzwtwi8ZIA0QyCxKaBEpQltQDFovuTIstOA5NQdzMTKQnMgQSkTejdiYLjYPmFf_gLpbKIxXxdZVevqJomWri0HjDgaqTDQa98jXXdP3GnPeJtaM6Mzm1eiYeQWvRKnN8TV-3AKs2HHbQ=C7536964"
JQL="project = 'SPAC' and status = 'To Do'"

curl \
	-H "Content-Type: application/json" \
	--get \
	--data-urlencode "endpoint_id=214036311874631563446" \
	--data-urlencode "jql=$JQL" \
	--data-urlencode "fields=description" \
	--data-urlencode "expand=changelog" \
	http://localhost:8888/jira/search
