/**
 * @swagger
 * /api/templates:
 *   get:
 *     summary: Get all templates for current user
 *     tags: [Templates]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's templates
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Template'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not a program manager
 *       500:
 *         description: Server error
 *   post:
 *     summary: Create a new template
 *     tags: [Templates]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 description: Template title
 *               content:
 *                 type: string
 *                 description: Template content
 *     responses:
 *       201:
 *         description: Template created
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not a program manager
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/templates/{id}:
 *   get:
 *     summary: Get a template by ID
 *     tags: [Templates]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Template ID
 *     responses:
 *       200:
 *         description: The template
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Template'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not a program manager
 *       404:
 *         description: Template not found
 *       500:
 *         description: Server error
 *   put:
 *     summary: Update a template
 *     tags: [Templates]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Template ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Template title
 *               content:
 *                 type: string
 *                 description: Template content
 *     responses:
 *       200:
 *         description: Template updated
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not a program manager
 *       404:
 *         description: Template not found
 *       500:
 *         description: Server error
 *   delete:
 *     summary: Delete a template
 *     tags: [Templates]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Template ID
 *     responses:
 *       200:
 *         description: Template deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not a program manager
 *       404:
 *         description: Template not found
 *       500:
 *         description: Server error
 */ 