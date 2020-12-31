const path = require('path');
const express = require('express');
const router = express.Router();

const teacherController = require('../controllers/teacherControllers');

//dashboard
router.get('/dashboard', teacherController.getDashboard);

//treasure box
router.post('/treasurebox/addPrize', teacherController.addPrize);
router.get('/treasurebox/editPrize', teacherController.getEditPrize);
router.post('/treasurebox/editPrize', teacherController.postEditPrize);
router.post('/treasurebox/deletePrize', teacherController.deletePrize);

module.exports = router;