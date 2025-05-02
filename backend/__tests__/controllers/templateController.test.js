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
  });
}); 