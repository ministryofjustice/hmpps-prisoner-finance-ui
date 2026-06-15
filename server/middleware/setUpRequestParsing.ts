import express, { Router } from 'express'

export default function setUpRequestParsing(): Router {
  const router = express.Router()
  router.use(express.json())
  router.use(express.urlencoded({ extended: true }))
  return router
}
