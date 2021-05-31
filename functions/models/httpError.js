class HttpError extends Error {
  constructor(errorMessage, errorCode) {
    super(errorMessage) // Add a "message" property
    this.code = errorCode // Adds a "code" property
    // this.message = errorMessage
  }
}

module.exports = HttpError
