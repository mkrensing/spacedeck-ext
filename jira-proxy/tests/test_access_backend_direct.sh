#!/bin/bash
# Rest-API Doku: https://developer.atlassian.com/cloud/jira/platform/rest/v3/intro/
# Dokumenation zu basic-auth: https://developer.atlassian.com/cloud/jira/platform/basic-auth-for-rest-apis/
# Erzeugung von Tokens: https://id.atlassian.com/manage-profile/security/api-tokens
USERNAME=info@krensing.com
API_TOKEN="ATATT3xFfGF0bgDl-pKfH2HV38yJLdDAh-kRWygKvqMzwtwi8ZIA0QyCxKaBEpQltQDFovuTIstOA5NQdzMTKQnMgQSkTejdiYLjYPmFf_gLpbKIxXxdZVevqJomWri0HjDgaqTDQa98jXXdP3GnPeJtaM6Mzm1eiYeQWvRKnN8TV-3AKs2HHbQ=C7536964"

curl -D- \
	-u ${USERNAME}:${API_TOKEN} \
	-X GET \
	-H "Content-Type: application/json" \
	https://krensing.atlassian.net/rest/api/3/issue/COAC-4
