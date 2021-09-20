const functions = require('firebase-functions')
const express = require('express')
const cors = require('cors')
const { check } = require('express-validator')
const { v4: uuidv4 } = require('uuid')
const argon = require('argon2')
const axios = require('axios')
const cred = require('./cred.json')
const key = require('./utilities/key')
const handleValidationResults = require('./utilities/handleValidationResults')

const admin = require('firebase-admin')
admin.initializeApp({
  credential: admin.credential.cert(cred),
})

const app = express()
app.use(cors({ origin: '*' }))

const db = admin.firestore()

// SIGNUP ROUTE
app.post(
  '/signup',
  [
    check('firstName').not().isEmpty().trim().escape(),
    check('username').not().isEmpty().trim().escape(),
    check('email').not().isEmpty().trim().escape().isEmail().normalizeEmail(),
    check('password').not().isEmpty().trim().escape().isLength({ min: 7 }),
    check('confirmPassword')
      .not()
      .isEmpty()
      .trim()
      .escape()
      .custom((value, { req, res }) => {
        if (value !== req.body.password) {
          res.send({code: 422, message: 'Passwords do not match'})
        }
        return true
      }),
  ],
  async (req, res) => {
    handleValidationResults(req, res)

    const usersRef = db.collection('users')
    const emailMatch = await usersRef.where('email', '==', req.body.email).get()
    const usernameMatch = await usersRef.where('username', '==', req.body.username).get()
    
    let errorMessage

    if (emailMatch.docs.length && usernameMatch.docs.length) {
      errorMessage = 'Email and username are already in use. Please enter a different email and username, and try again.'
      res.send({code: 422, message: errorMessage})  
      return
    } else if (emailMatch.docs.length) {
        errorMessage = 'A user with this email already exists. Please choose a different email and try again.'
        res.send({code: 422, message: errorMessage})
        return
    } else if (usernameMatch.docs.length) {
        errorMessage = 'Username is taken. Please choose a different username and try again.'
        res.send({code: 422, message: errorMessage})
        return
    } else {
      try {
        const userId = uuidv4()
        const password = req.body.password
        const hashedPassword = await argon.hash(password)
  
        const additionalClaims = {
          firstName: req.body.firstName,
          username: req.body.username,
          email: req.body.email,
          isAdmin: false,
        }
  
        const customToken = await admin
          .auth()
          .createCustomToken(userId, additionalClaims)
  
        const userData = {
          ...additionalClaims,
          password: hashedPassword,
        }
        await admin
          .firestore()
          .collection('users')
          .doc(userId)
          .set(userData)
  
        res.status(201).send({ token: customToken, userData: { ...additionalClaims } })
      } catch (error) {
        res.send({code: 422, error: error})
      }
    }
  }
)

// LOGIN ROUTE
app.post(
  '/login',
  [
    check('email').not().isEmpty().trim().escape().isEmail().normalizeEmail(),
    check('password').not().isEmpty().trim().escape(),
  ],
  async (req, res) => {
    handleValidationResults(req)
    try {
      const email = req.body.email
      const password = req.body.password

      const usersRef = db.collection('users')
      const userRecord = await usersRef.where('email', '==', email).get()
      const userRecordFields = userRecord.docs[0].data()

      let errorMessage

      const passwordVerified = await argon.verify(
        userRecordFields.password,
        password
      )

      if (userRecordFields && passwordVerified) {
        const userId = userRecord.docs[0].id
        const additionalClaims = {
          firstName: userRecordFields.firstName,
          username: userRecordFields.username,
          email: userRecordFields.email,
          isAdmin: userRecordFields.isAdmin,
        }

        const customToken = await admin
          .auth()
          .createCustomToken(userId, additionalClaims)

        res.status(200).send({token: customToken, userData: { ...additionalClaims }})
      } else {
        errorMessage = 'Email or password is invalid, or user record does not exist'
        res.send({code: 400, message: errorMessage})
      }
    } catch (error) {
      res.send({code: 422, caughtError: error})
    }
  }
)


// GET LAT/LNG COORDINATES
// https://maps.googleapis.com/maps/api/geocode/json?address=1600+Amphitheatre+Parkway,+Mountain+View,+CA&key=YOUR_API_KEY


app.get(
  '/coordinates',
  async (req, res) => {
    try {
      const address = req.body.address
      const coordinatesUrl = `
        https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${key}
      `
      const response = await axios({
        method: 'GET',
        url: coordinatesUrl,
      })
      const responseData = response.data
      if (!responseData || responseData.status === "ZERO_RESULTS") {
        const error = {code: 422, message: 'Could not find location for the provided address'}
        return res.send(error)
      }

      const locationInfo = {
        formattedAddress: responseData.results[0].formatted_address, 
        coordinates: responseData.results[0].geometry.location
      }
      res.status(200).send({results: locationInfo})
    } catch (error) {
      res.send({code: 422, caughtError: error})
    }
  }
)


exports.user = functions.https.onRequest(app)
