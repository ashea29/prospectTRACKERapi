const { validationResult } = require('express-validator')

const handleValidationResults = (req, res) => {
  const validationErrors = validationResult(req)
  const invalidFields = []

  if (!validationErrors.isEmpty()) {
    validationErrors.array().forEach((err) => {
      invalidFields.push(err.param)
    })
    res.send({code: 422, message: `Invalid input: [${invalidFields}]. Please verify and try again`})
    return 
  }
}

module.exports = handleValidationResults