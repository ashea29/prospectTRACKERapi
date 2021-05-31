const { validationResult } = require('express-validator')
const HttpError = require('../models/httpError')

const handleValidationResults = (req, res) => {
  const validationErrors = validationResult(req)
  const invalidFields = []

  if (!validationErrors.isEmpty()) {
    validationErrors.array().forEach((err) => {
      invalidFields.push(err.param)
    })
    const error = new HttpError(`Invalid input: [${invalidFields}]. Please verify and try again`, 422)
    // res.send({errorCode: 422, message: `Invalid input: [${invalidFields}]. Please verify and try again`})
    res.send(error)
    return 
  }
}

module.exports = handleValidationResults