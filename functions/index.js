const functions = require("firebase-functions");
const express = require('express')
const { check, param } = require('express-validator')
const cors = require('cors')
const { v4: uuidv4 } = require('uuid')
const argon = require('argon2')
const cred = require('./cred.json')

const admin = require('firebase-admin')

admin.initializeApp({
  credential: admin.credential.cert(cred),
})

const app = express()
app.use(cors({ origin: true }))

const db = admin.firestore()
