const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { prisma } = require('../utils/prismaClient');

// GET /api/notifications
const getMyNotifications = asyncHandler(async (req, res) => {
  const { isRead, page, limit } = req.query;

  const where = { userId: req.user.id };
  if (isRead !== undefined) where.isRead = isRead;

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId: req.user.id, isRead: false } }),
  ]);

  return new ApiResponse(
    200,
    {
      notifications,
      unreadCount,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    },
    'Notifications retrieved.'
  ).send(res);
});

// GET /api/notifications/unread-count
const getUnreadCount = asyncHandler(async (req, res) => {
  const unreadCount = await prisma.notification.count({
    where: { userId: req.user.id, isRead: false },
  });
  return new ApiResponse(200, { unreadCount }, 'Unread count retrieved.').send(res);
});

// PATCH /api/notifications/:id/read
const markAsRead = asyncHandler(async (req, res) => {
  const result = await prisma.notification.updateMany({
    where: { id: req.params.id, userId: req.user.id },
    data: { isRead: true },
  });

  if (result.count === 0) {
    throw ApiError.notFound('Notification not found.');
  }

  return new ApiResponse(200, null, 'Notification marked as read.').send(res);
});

// PATCH /api/notifications/read-all
const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await prisma.notification.updateMany({
    where: { userId: req.user.id, isRead: false },
    data: { isRead: true },
  });

  return new ApiResponse(200, { updated: result.count }, 'All notifications marked as read.').send(res);
});

// DELETE /api/notifications/:id
const deleteNotification = asyncHandler(async (req, res) => {
  const result = await prisma.notification.deleteMany({
    where: { id: req.params.id, userId: req.user.id },
  });

  if (result.count === 0) {
    throw ApiError.notFound('Notification not found.');
  }

  return new ApiResponse(200, null, 'Notification deleted.').send(res);
});

module.exports = { getMyNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification };
