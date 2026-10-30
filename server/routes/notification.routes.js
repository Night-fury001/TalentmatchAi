const express = require('express');
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const { idParamSchema } = require('../validators/common.validators');
const { listNotificationsQuerySchema } = require('../validators/notification.validators');

const router = express.Router();

// Every route requires authentication, but is open to any role.
router.use(protect);

router.get('/', validate(listNotificationsQuerySchema, 'query'), notificationController.getMyNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.patch('/read-all', notificationController.markAllAsRead);
router.patch('/:id/read', validate(idParamSchema, 'params'), notificationController.markAsRead);
router.delete('/:id', validate(idParamSchema, 'params'), notificationController.deleteNotification);

module.exports = router;
