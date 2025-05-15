/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: User ID
 *         name:
 *           type: string
 *           description: User's full name
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         role:
 *           type: string
 *           enum: [tudeng, programmijuht]
 *           description: User's role
 *     Group:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: The group ID
 *         name:
 *           type: string
 *           description: The group name
 *         is_role_group:
 *           type: boolean
 *           description: Whether the group is a role-based group
 *     Notification:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Notification ID
 *         title:
 *           type: string
 *           description: Notification title
 *         content:
 *           type: string
 *           description: Notification content
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Creation date and time
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Last update date and time
 *         author_id:
 *           type: integer
 *           description: ID of the notification author
 *         author_name:
 *           type: string
 *           description: Name of the notification author
 *     Template:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Template ID
 *         title:
 *           type: string
 *           description: Template title
 *         content:
 *           type: string
 *           description: Template content
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Creation date and time
 *         user_id:
 *           type: integer
 *           description: ID of the template creator
 *     Favorite:
 *       type: object
 *       properties:
 *         notification_id:
 *           type: integer
 *           description: ID of the favorited notification
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */ 