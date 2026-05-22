let accessToken = null

function getAccessToken() {
return accessToken
}

function setAccessToken(token) {
accessToken = token
}

function clearAccessToken() {
accessToken = null
}

export { getAccessToken, setAccessToken, clearAccessToken }