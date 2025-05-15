/**
 * @swagger
 * /api/favorites:
 *   get:
 *     summary: Get all favorites for the logged-in user
 *     tags: [Favorites]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's favorites
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Favorite'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 *   post:
 *     summary: Add a notification to favorites
 *     tags: [Favorites]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - notificationId
 *             properties:
 *               notificationId:
 *                 type: integer
 *                 description: ID of the notification to favorite
 *     responses:
 *       201:
 *         description: Added to favorites
 *       400:
 *         description: Missing notification ID
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/favorites/{notificationId}:
 *   delete:
 *     summary: Remove a notification from favorites
 *     tags: [Favorites]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the notification to remove from favorites
 *     responses:
 *       200:
 *         description: Removed from favorites
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */ 