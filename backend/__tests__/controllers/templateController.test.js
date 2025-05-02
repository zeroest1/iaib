const jwt = require('jsonwebtoken');

// Create mock db module with connect method that returns a client with query and release methods
const mockClient = {
  query: jest.fn().mockImplementation(() => Promise.resolve({ rows: [] })),
  release: jest.fn()
};

// Mock db with working connect method
const mockDb = {
  query: jest.fn().mockImplementation(() => Promise.resolve({ rows: [] })),
  connect: jest.fn().mockImplementation(() => Promise.resolve(mockClient))
};

// Mock the modules
jest.mock('../../db', () => mockDb);

// Mock console.error to prevent test output pollution and to verify it's called
console.error = jest.fn();

// Import controller after mocks are set up
const { 
  getTemplates, 
  getTemplateById, 
  createTemplate, 
  updateTemplate, 
  deleteTemplate 
} = require('../../controllers/templateController');

describe('Template Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper functions for testing
  const createMockRequest = (overrides = {}) => ({
    params: {},
    body: {},
    user: { id: 1, role: 'programmijuht' },
    ...overrides
  });

  const createMockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  describe('getTemplates', () => {
    test('should return templates for program manager', async () => {
      // Mock the database response
      const templates = [
        { id: 1, title: 'Template 1', created_by: 1 },
        { id: 2, title: 'Template 2', created_by: 1 }
      ];
      mockDb.query
        .mockResolvedValueOnce({ rows: templates }) // First query returns templates
        .mockResolvedValueOnce({ rows: [] }); // Second query returns template groups (empty in this case)

      // Create request and response objects
      const req = createMockRequest();
      const res = createMockResponse();
      
      // Call the controller
      await getTemplates(req, res);
      
      // Assertions
      expect(res.json).toHaveBeenCalled();
      expect(res.json.mock.calls[0][0]).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 1, title: 'Template 1' }),
          expect.objectContaining({ id: 2, title: 'Template 2' })
        ])
      );
    });

    test('should handle empty template list', async () => {
      // Mock the database response for empty list
      mockDb.query
        .mockResolvedValueOnce({ rows: [] }) // No templates
        .mockResolvedValueOnce({ rows: [] }); // No template groups

      // Create request and response objects
      const req = createMockRequest();
      const res = createMockResponse();
      
      // Call the controller
      await getTemplates(req, res);
      
      // Assertions
      expect(res.json).toHaveBeenCalledWith([]);
    });

    test('should handle templates with groups', async () => {
      // Mock the database response
      const templates = [
        { id: 1, title: 'Template 1', created_by: 1 },
        { id: 2, title: 'Template 2', created_by: 1 }
      ];
      const templateGroups = [
        { template_id: 1, id: 100, name: 'Group 1', is_role_group: true },
        { template_id: 1, id: 101, name: 'Group 2', is_role_group: false },
        { template_id: 2, id: 102, name: 'Group 3', is_role_group: true }
      ];

      mockDb.query
        .mockResolvedValueOnce({ rows: templates }) // First query returns templates
        .mockResolvedValueOnce({ rows: templateGroups }); // Second query returns template groups

      // Create request and response objects
      const req = createMockRequest();
      const res = createMockResponse();
      
      // Call the controller
      await getTemplates(req, res);
      
      // Assertions
      expect(res.json).toHaveBeenCalled();
      
      // Verify template 1 has two groups
      const result = res.json.mock.calls[0][0];
      const template1 = result.find(t => t.id === 1);
      expect(template1.target_groups).toHaveLength(2);
      expect(template1.target_groups[0]).toEqual(
        expect.objectContaining({ id: 100, name: 'Group 1', is_role_group: true })
      );

      // Verify template 2 has one group
      const template2 = result.find(t => t.id === 2);
      expect(template2.target_groups).toHaveLength(1);
      expect(template2.target_groups[0]).toEqual(
        expect.objectContaining({ id: 102, name: 'Group 3', is_role_group: true })
      );
    });

    test('should handle database error', async () => {
      // Mock the database error
      mockDb.query.mockRejectedValueOnce(new Error('Database error'));

      // Create request and response objects
      const req = createMockRequest();
      const res = createMockResponse();
      
      // Call the controller
      await getTemplates(req, res);
      
      // Assertions
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
      expect(console.error).toHaveBeenCalledWith('Error getting templates:', expect.any(Error));
    });
  });

  describe('getTemplateById', () => {
    test('should return 404 when template not found', async () => {
      // Mock the database response
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      // Create request and response objects
      const req = createMockRequest({ params: { id: '999' } });
      const res = createMockResponse();
      
      // Call the controller
      await getTemplateById(req, res);
      
      // Assertions
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Template not found' });
    });

    test('should return the template when found', async () => {
      // Mock the database response
      const template = { id: 1, title: 'Template 1', content: 'Content' };
      mockDb.query
        .mockResolvedValueOnce({ rows: [template] })
        .mockResolvedValueOnce({ rows: [] }); // Empty target groups

      // Create request and response objects
      const req = createMockRequest({ params: { id: '1' } });
      const res = createMockResponse();
      
      // Call the controller
      await getTemplateById(req, res);
      
      // Assertions
      expect(res.json).toHaveBeenCalled();
      expect(res.json.mock.calls[0][0]).toEqual(
        expect.objectContaining({ 
          id: 1, 
          title: 'Template 1',
          target_groups: [] 
        })
      );
    });

    test('should return template with target groups', async () => {
      // Mock the database response
      const template = { id: 1, title: 'Template 1', content: 'Content' };
      const groups = [
        { id: 100, name: 'Group 1', is_role_group: true },
        { id: 101, name: 'Group 2', is_role_group: false }
      ];
      
      mockDb.query
        .mockResolvedValueOnce({ rows: [template] })
        .mockResolvedValueOnce({ rows: groups });

      // Create request and response objects
      const req = createMockRequest({ params: { id: '1' } });
      const res = createMockResponse();
      
      // Call the controller
      await getTemplateById(req, res);
      
      // Assertions
      expect(res.json).toHaveBeenCalled();
      expect(res.json.mock.calls[0][0]).toEqual(
        expect.objectContaining({ 
          id: 1, 
          title: 'Template 1',
          target_groups: expect.arrayContaining([
            expect.objectContaining({ id: 100, name: 'Group 1' }),
            expect.objectContaining({ id: 101, name: 'Group 2' })
          ])
        })
      );
    });

    test('should handle database error', async () => {
      // Mock the database error
      mockDb.query.mockRejectedValueOnce(new Error('Database error'));

      // Create request and response objects
      const req = createMockRequest({ params: { id: '1' } });
      const res = createMockResponse();
      
      // Call the controller
      await getTemplateById(req, res);
      
      // Assertions
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
      expect(console.error).toHaveBeenCalledWith('Error getting template:', expect.any(Error));
    });
  });

  describe('createTemplate', () => {
    test('should return 400 if required fields are missing', async () => {
      // Create request with missing fields
      const req = createMockRequest({ 
        body: { content: 'Content' } // Missing name and title
      });
      const res = createMockResponse();
      
      // Call the controller
      await createTemplate(req, res);
      
      // Assertions
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Name, title and content are required' });
    });

    test('should create template successfully', async () => {
      // Mock template data and response
      const templateData = { 
        name: 'Template Name',
        title: 'New Template', 
        content: 'Template content',
        category: 'announcement',
        priority: 'high'
      };
      const createdTemplate = { 
        id: 1, 
        ...templateData, 
        created_by: 1 
      };
      
      // Mock the client query responses
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [createdTemplate] }) // INSERT template
        .mockResolvedValueOnce({}) // COMMIT

      // Create request and response objects
      const req = createMockRequest({ body: templateData });
      const res = createMockResponse();
      
      // Call the controller
      await createTemplate(req, res);
      
      // Assertions
      expect(res.status).toHaveBeenCalledWith(201);
      expect(mockClient.release).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ 
        id: 1,
        name: 'Template Name',
        title: 'New Template'
      }));
    });

    test('should create template with target groups', async () => {
      // Mock template data and response
      const templateData = { 
        name: 'Template Name',
        title: 'New Template', 
        content: 'Template content',
        category: 'announcement',
        priority: 'high',
        targetGroups: [100, 101]
      };
      const createdTemplate = { 
        id: 1, 
        ...templateData, 
        created_by: 1 
      };
      const groups = [
        { id: 100, name: 'Group 1', is_role_group: true },
        { id: 101, name: 'Group 2', is_role_group: false }
      ];
      
      // Mock the client query responses
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [createdTemplate] }) // INSERT template
        .mockResolvedValueOnce({}) // INSERT groups
        .mockResolvedValueOnce({ rows: groups }) // SELECT groups
        .mockResolvedValueOnce({}) // COMMIT

      // Create request and response objects
      const req = createMockRequest({ body: templateData });
      const res = createMockResponse();
      
      // Call the controller
      await createTemplate(req, res);
      
      // Assertions
      expect(res.status).toHaveBeenCalledWith(201);
      expect(mockClient.release).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ 
        id: 1,
        name: 'Template Name',
        target_groups: expect.arrayContaining([
          expect.objectContaining({ id: 100, name: 'Group 1' }),
          expect.objectContaining({ id: 101, name: 'Group 2' })
        ])
      }));
    });

    test('should handle database error', async () => {
      // Mock template data
      const templateData = { 
        name: 'Template Name',
        title: 'New Template', 
        content: 'Template content'
      };
      
      // Mock the client query to throw an error
      mockClient.query.mockRejectedValueOnce(new Error('Database error'));
      
      // Create request and response objects
      const req = createMockRequest({ body: templateData });
      const res = createMockResponse();
      
      // Call the controller
      await createTemplate(req, res);
      
      // Assertions
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
      expect(console.error).toHaveBeenCalledWith('Error creating template:', expect.any(Error));
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('updateTemplate', () => {
    test('should return 404 when template not found', async () => {
      // Mock client query responses
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [] }); // No template found
      
      // Create request and response objects
      const req = createMockRequest({ 
        params: { id: '999' },
        body: { 
          name: 'Updated Name',
          title: 'Updated Title',
          content: 'Updated Content',
          category: 'announcement',
          priority: 'high'
        }
      });
      const res = createMockResponse();
      
      // Call the controller
      await updateTemplate(req, res);
      
      // Assertions
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ 
        error: 'Template not found or you are not authorized' 
      });
      expect(mockClient.release).toHaveBeenCalled();
    });

    test('should update template successfully without groups', async () => {
      // Mock template data
      const templateData = { 
        name: 'Updated Name',
        title: 'Updated Title', 
        content: 'Updated content',
        category: 'announcement',
        priority: 'high',
        targetGroups: [] // No groups
      };
      const updatedTemplate = { 
        id: 1, 
        ...templateData, 
        created_by: 1 
      };
      
      // Mock client query responses
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 1, created_by: 1 }] }) // Template exists
        .mockResolvedValueOnce({ rows: [updatedTemplate] }) // UPDATE template
        .mockResolvedValueOnce({}) // DELETE template groups
        .mockResolvedValueOnce({}); // COMMIT
      
      // Create request and response objects
      const req = createMockRequest({ 
        params: { id: '1' },
        body: templateData
      });
      const res = createMockResponse();
      
      // Call the controller
      await updateTemplate(req, res);
      
      // Assertions
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ 
        id: 1,
        name: 'Updated Name',
        title: 'Updated Title',
        target_groups: []
      }));
      expect(mockClient.release).toHaveBeenCalled();
    });

    test('should update template with target groups', async () => {
      // Mock template data
      const templateData = { 
        name: 'Updated Name',
        title: 'Updated Title', 
        content: 'Updated content',
        category: 'announcement',
        priority: 'high',
        targetGroups: [100, 101] // With groups
      };
      const updatedTemplate = { 
        id: 1, 
        ...templateData, 
        created_by: 1 
      };
      const groups = [
        { id: 100, name: 'Group 1', is_role_group: true },
        { id: 101, name: 'Group 2', is_role_group: false }
      ];
      
      // Mock client query responses
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 1, created_by: 1 }] }) // Template exists
        .mockResolvedValueOnce({ rows: [updatedTemplate] }) // UPDATE template
        .mockResolvedValueOnce({}) // DELETE template groups
        .mockResolvedValueOnce({}) // INSERT groups
        .mockResolvedValueOnce({ rows: groups }) // SELECT groups
        .mockResolvedValueOnce({}); // COMMIT
      
      // Create request and response objects
      const req = createMockRequest({ 
        params: { id: '1' },
        body: templateData
      });
      const res = createMockResponse();
      
      // Call the controller
      await updateTemplate(req, res);
      
      // Assertions
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ 
        id: 1,
        name: 'Updated Name',
        title: 'Updated Title',
        target_groups: expect.arrayContaining([
          expect.objectContaining({ id: 100, name: 'Group 1' }),
          expect.objectContaining({ id: 101, name: 'Group 2' })
        ])
      }));
      expect(mockClient.release).toHaveBeenCalled();
    });

    test('should handle database error', async () => {
      // Mock the client query to throw an error
      mockClient.query.mockRejectedValueOnce(new Error('Database error'));
      
      // Create request and response objects
      const req = createMockRequest({ 
        params: { id: '1' },
        body: { 
          name: 'Updated Name',
          title: 'Updated Title',
          content: 'Updated Content'
        }
      });
      const res = createMockResponse();
      
      // Call the controller
      await updateTemplate(req, res);
      
      // Assertions
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
      expect(console.error).toHaveBeenCalledWith('Error updating template:', expect.any(Error));
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('deleteTemplate', () => {
    test('should return 404 when template not found', async () => {
      // Mock client query responses
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [] }); // Template not found
      
      // Create request and response objects
      const req = createMockRequest({ params: { id: '999' } });
      const res = createMockResponse();
      
      // Call the controller
      await deleteTemplate(req, res);
      
      // Assertions
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ 
        error: 'Template not found or you are not authorized' 
      });
      expect(mockClient.release).toHaveBeenCalled();
    });

    test('should delete template successfully', async () => {
      // Mock client query responses
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 1, created_by: 1 }] }) // Template found
        .mockResolvedValueOnce({}) // Delete template groups
        .mockResolvedValueOnce({}) // Delete template
        .mockResolvedValueOnce({}); // COMMIT
      
      // Create request and response objects
      const req = createMockRequest({ params: { id: '1' } });
      const res = createMockResponse();
      
      // Call the controller
      await deleteTemplate(req, res);
      
      // Assertions
      expect(res.json).toHaveBeenCalledWith({ message: 'Template deleted successfully' });
      expect(mockClient.release).toHaveBeenCalled();
    });

    test('should handle database error', async () => {
      // Mock client query to throw error
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockRejectedValueOnce(new Error('Database error')); // Error on check
      
      // Create request and response objects
      const req = createMockRequest({ params: { id: '1' } });
      const res = createMockResponse();
      
      // Call the controller
      await deleteTemplate(req, res);
      
      // Assertions
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
      expect(console.error).toHaveBeenCalledWith('Error deleting template:', expect.any(Error));
      expect(mockClient.release).toHaveBeenCalled();
    });
  });
}); 