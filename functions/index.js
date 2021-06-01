const functions = require('firebase-functions')
const express = require('express')
const cors = require('cors')
const { check, param } = require('express-validator')
const { v4: uuidv4 } = require('uuid')
const argon = require('argon2')
const cred = require('./cred.json')
const HttpError = require('./models/httpError')
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
          const error = new HttpError('Passwords do not match', 422)
          res.send(error)
        }
        return true
      }),
  ],
  async (req, res) => {
    handleValidationResults(req, res)

    const usersRef = db.collection('users')
    const emailMatch = await usersRef.where('email', '==', req.body.email).get()
    const usernameMatch = await usersRef.where('username', '==', req.body.email).get()
    
    let errorMessage

    if (emailMatch.docs.length && usernameMatch.docs.length) {
      errorMessage = 'Email and username are already in use. Please enter a different email and username, and try again.'
      const error = new HttpError(errorMessage, 422)
      res.send(error)  
      return
    } else if (emailMatch.docs.length) {
      errorMessage = 'A user with this email already exists. Please choose a different email and try again.'
      const error = new HttpError(errorMessage, 422)
      res.send(error)
      return
    } else if (usernameMatch.docs.length) {
        errorMessage = 'Username is taken. Please choose a different username and try again.'
        const error = new HttpError(errorMessage, 422)
        res.send(error)
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
        const docRef = await admin
          .firestore()
          .collection('users')
          .doc(userId)
          .set(userData)
  
        res.status(201).send({ token: customToken, doc: docRef })
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
        errorMessage = 'Username or password is invalid, or user record does not exist'
        const error = new HttpError(errorMessage, 400)
        res.send(error)
      }
    } catch (error) {
      console.log(error)
      res.send({code: 422, error: {adminMsg: 'Unknown error', caughtError: error}})
    }
  }
)

exports.user = functions.https.onRequest(app)
