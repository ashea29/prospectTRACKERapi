const functions = require("firebase-functions")
const express = require("express")
const { check, param } = require("express-validator")
const cors = require("cors")
const { v4: uuidv4 } = require("uuid")
const argon = require("argon2")
const cred = require("./cred.json")

const admin = require("firebase-admin")

admin.initializeApp({
  credential: admin.credential.cert(cred),
})

const app = express()
app.use(cors({ origin: true }))

const db = admin.firestore()

// SIGNUP ROUTE
app.post("/signup", async (req, res) => {
  try {
    const userId = uuidv4()
    const password = req.body.password
    const hashedPassword = await argon.hash(password)

    const additionalClaims = {
      email: req.body.email,
      username: req.body.username,
      password: hashedPassword,
      isAdmin: false,
    }

    const customToken = await admin
      .auth()
      .createCustomToken(userId, additionalClaims)

    const userData = {
      ...additionalClaims,
      token: customToken,
    }
    const docRef = await admin
      .firestore()
      .collection("users")
      .doc(userId)
      .set(userData)

    res.status(201).send({ token: customToken, doc: docRef })
  } catch (error) {
    res.status(500).send(error)
  }
})

// LOGIN ROUTE
app.post("/login", async (req, res) => {
  try {
    const username = req.body.username
    const password = req.body.password

    const usersRef = db.collection("users")
    const userRecord = await usersRef.where("username", "==", username).get()
      .docs[0]
    const userRecordFields = await userRecord.data()

    const passwordVerified = await argon.verify(
      userRecordFields.password,
      password
    )

    if (userRecordFields && passwordVerified) {
      const userId = userRecord.id
      const additionalClaims = {
        username,
        password: userRecordFields.password,
        email: userRecordFields.email,
        isAdmin: userRecordFields.isAdmin,
      }

      const customToken = await admin
        .auth()
        .createCustomToken(userId, additionalClaims)

      res.status(200).send(customToken)
    } else {
      res
        .status(400)
        .send("Username or password is invalid, or user record does not exist")
    }
  } catch (error) {
    res.status(500).send(error)
  }
})

exports.user = functions.https.onRequest(app)
