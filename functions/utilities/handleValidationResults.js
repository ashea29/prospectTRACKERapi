const { validationResult } = require('express-validator')
const HttpError = require('../models/httpError')

const handleValidationResults = (req) => {
  const validationErrors = validationResult(req)
  const invalidFields = []

  if (!validationErrors.isEmpty()) {
    validationErrors.array().forEach((err) => {
      invalidFields.push(err.param)
    })
    throw new HttpError(`Invalid input: [${invalidFields}]. Please verify and try again`, 422)
  }
}

module.exports = handleValidationResults