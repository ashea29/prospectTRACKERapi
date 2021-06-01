class HttpError extends Error {
  constructor(errorMessage, errorCode) {
    super(errorMessage)
    this.code = errorCode 
    // this.message = errorMessage
  }
}

module.exports = HttpError
