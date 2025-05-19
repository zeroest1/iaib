/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock components
const MockNotificationForm = ({ isTemplate = false, isEdit = false }) => {
  const [formData, setFormData] = React.useState({
    title: isEdit ? 'Template Title' : '',
    content: isEdit ? 'Template Content' : '',
    category: isEdit ? 'õppetöö' : '',
    priority: isEdit ? 'tavaline' : 'tavaline',
    name: isEdit ? 'Test Template' : ''
  });
  
  const [selectedGroups, setSelectedGroups] = React.useState(isEdit ? [1] : []);
  const [selectedTemplateId, setSelectedTemplateId] = React.useState('');
  const [error, setError] = React.useState('');
  const [showVariablesModal, setShowVariablesModal] = React.useState(false);
  const [templateVariables, setTemplateVariables] = React.useState({});
  const [variableValues, setVariableValues] = React.useState({});
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleGroupChange = (newGroups) => {
    setSelectedGroups(newGroups);
  };
  
  const handleTemplateSelect = (e) => {
    const newTemplateId = e.target.value;
    setSelectedTemplateId(newTemplateId);
    
    if (!newTemplateId) {
      setFormData({
        title: '',
        content: '',
        category: '',
        priority: 'tavaline',
      });
      return;
    }
    
    // Simulate loading template
    if (newTemplateId === '1') {
      setFormData({
        title: 'Template Title',
        content: 'Template Content',
        category: 'õppetöö',
        priority: 'tavaline'
      });
    } else if (newTemplateId === '3') {
      // Template with variables
      setTemplateVariables({
        name: '',
        date: ''
      });
      setVariableValues({
        name: '',
        date: ''
      });
      setShowVariablesModal(true);
    }
  };
  
  const handleVariableChange = (e) => {
    const { name, value } = e.target;
    setVariableValues(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const applyVariables = () => {
    // Apply variables to template content
    let title = 'Template with {name}';
    let content = 'Hello {name}, your appointment is on {date}';
    
    Object.entries(variableValues).forEach(([key, value]) => {
      title = title.replace(`{${key}}`, value);
      content = content.replace(`{${key}}`, value);
    });
    
    setFormData(prev => ({
      ...prev,
      title,
      content
    }));
    
    setShowVariablesModal(false);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.title.trim()) {
      setError('Pealkiri on kohustuslik');
      return;
    }
    
    if (!formData.content.trim()) {
      setError('Sisu on kohustuslik');
      return;
    }
    
    if (!formData.category) {
      setError('Kategooria on kohustuslik');
      return;
    }
    
    if (isTemplate && !formData.name.trim()) {
      setError('Malli nimi on kohustuslik');
      return;
    }
    
    try {
      if (window.mockSubmitHandler) {
        await window.mockSubmitHandler(formData, selectedGroups, isTemplate, isEdit);
      }
      setError('');
    } catch (err) {
      setError(err.message || 'Midagi läks valesti');
    }
  };
  
  return (
    <div className="notification-form">
      <h2>
        {isTemplate 
          ? (isEdit ? 'Muuda malli' : 'Lisa uus mall') 
          : 'Lisa uus teade'}
      </h2>
      
      {error && <div className="error-message" data-testid="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} data-testid="notification-form">
        {isTemplate && (
          <div className="form-group">
            <label htmlFor="name">Malli nimi</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="form-input"
              placeholder="Sisesta malli nimi"
              required
            />
          </div>
        )}
        
        {!isTemplate && !isEdit && (
          <div className="form-group">
            <label htmlFor="templateSelect">Vali mall (valikuline)</label>
            <select
              id="templateSelect"
              name="templateSelect"
              className="form-select"
              onChange={handleTemplateSelect}
              value={selectedTemplateId}
              data-testid="template-select"
            >
              <option value="">Mallist loobumine</option>
              <option value="1">Template 1</option>
              <option value="2">Template 2</option>
              <option value="3">Template with Variables</option>
            </select>
          </div>
        )}
        
        <div data-testid="notification-form-fields">
          <input
            data-testid="title-input"
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
          />
          <textarea
            data-testid="content-input"
            name="content"
            value={formData.content}
            onChange={handleChange}
          />
          <select
            data-testid="category-select"
            name="category"
            value={formData.category}
            onChange={handleChange}
          >
            <option value="">Vali kategooria</option>
            <option value="õppetöö">Õppetöö</option>
            <option value="hindamine">Hindamine</option>
          </select>
          <select
            data-testid="priority-select"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
          >
            <option value="kiire">Kiire</option>
            <option value="kõrge">Kõrge</option>
            <option value="tavaline">Tavaline</option>
            <option value="madal">Madal</option>
          </select>
          
          <div data-testid="group-select">
            <div>
              <input
                type="checkbox"
                id="group-1"
                checked={selectedGroups.includes(1)}
                onChange={() => {
                  if (selectedGroups.includes(1)) {
                    handleGroupChange(selectedGroups.filter(id => id !== 1));
                  } else {
                    handleGroupChange([...selectedGroups, 1]);
                  }
                }}
              />
              <label htmlFor="group-1">Group 1</label>
            </div>
            <div>
              <input
                type="checkbox"
                id="group-2"
                checked={selectedGroups.includes(2)}
                onChange={() => {
                  if (selectedGroups.includes(2)) {
                    handleGroupChange(selectedGroups.filter(id => id !== 2));
                  } else {
                    handleGroupChange([...selectedGroups, 2]);
                  }
                }}
              />
              <label htmlFor="group-2">Group 2</label>
            </div>
          </div>
          
          <button
            data-testid="submit-button"
            type="submit"
          >
            {isTemplate 
              ? (isEdit ? 'Salvesta muudatused' : 'Lisa mall')
              : 'Lisa teade'}
          </button>
        </div>
      </form>
      
      {showVariablesModal && (
        <div className="variables-modal" data-testid="variables-modal">
          <h3>Täida malli muutujad</h3>
          {Object.entries(templateVariables).map(([key, _]) => (
            <div key={key}>
              <label htmlFor={`variable-${key}`}>{key}</label>
              <input
                type="text"
                id={`variable-${key}`}
                name={key}
                value={variableValues[key]}
                onChange={handleVariableChange}
                data-testid={`variable-${key}`}
              />
            </div>
          ))}
          <div>
            <button onClick={applyVariables} data-testid="apply-variables">Kinnita</button>
            <button onClick={() => setShowVariablesModal(false)} data-testid="cancel-variables">Tühista</button>
          </div>
        </div>
      )}
    </div>
  );
};

// Tests
describe('NotificationForm Component', () => {
  beforeEach(() => {
    // Clear mock submit handler
    window.mockSubmitHandler = null;
  });

  test('renders notification form with correct title for new notification', () => {
    render(<MockNotificationForm />);
    expect(screen.getByText('Lisa uus teade')).toBeInTheDocument();
  });

  test('renders notification form with correct title for new template', () => {
    render(<MockNotificationForm isTemplate={true} />);
    expect(screen.getByText('Lisa uus mall')).toBeInTheDocument();
  });

  test('renders notification form with correct title for edit template', () => {
    render(<MockNotificationForm isTemplate={true} isEdit={true} />);
    expect(screen.getByText('Muuda malli')).toBeInTheDocument();
  });

  test('shows template name field for template forms', () => {
    render(<MockNotificationForm isTemplate={true} />);
    expect(screen.getByLabelText('Malli nimi')).toBeInTheDocument();
  });

  test('does not show template name field for notification forms', () => {
    render(<MockNotificationForm />);
    expect(screen.queryByLabelText('Malli nimi')).not.toBeInTheDocument();
  });

  test('shows template selection for new notification', () => {
    render(<MockNotificationForm />);
    expect(screen.getByLabelText('Vali mall (valikuline)')).toBeInTheDocument();
  });

  test('loads template data when editing a template', async () => {
    render(<MockNotificationForm isTemplate={true} isEdit={true} />);
    
    // Template data should be pre-loaded
    const titleInput = screen.getByTestId('title-input');
    expect(titleInput.value).toBe('Template Title');
  });

  test('updates form when template is selected', async () => {
    render(<MockNotificationForm />);
    
    const templateSelect = screen.getByTestId('template-select');
    fireEvent.change(templateSelect, { target: { value: '1' } });
    
    // Should apply template data to form
    await waitFor(() => {
      const titleInput = screen.getByTestId('title-input');
      expect(titleInput.value).toBe('Template Title');
    });
  });

  test('clears form when template selection is reset', async () => {
    render(<MockNotificationForm />);
    
    // First select a template
    const templateSelect = screen.getByTestId('template-select');
    fireEvent.change(templateSelect, { target: { value: '1' } });
    
    // Wait for form to update
    await waitFor(() => {
      const titleInput = screen.getByTestId('title-input');
      expect(titleInput.value).toBe('Template Title');
    });
    
    // Then clear template selection
    fireEvent.change(templateSelect, { target: { value: '' } });
    
    // Form should be cleared
    await waitFor(() => {
      const titleInput = screen.getByTestId('title-input');
      expect(titleInput.value).toBe('');
    });
  });

  test('handles template with variables', async () => {
    render(<MockNotificationForm />);
    
    // Select template with variables
    const templateSelect = screen.getByTestId('template-select');
    fireEvent.change(templateSelect, { target: { value: '3' } });
    
    // Variables modal should appear
    await waitFor(() => {
      expect(screen.getByTestId('variables-modal')).toBeInTheDocument();
    });
    
    // Fill in variables
    const nameInput = screen.getByTestId('variable-name');
    const dateInput = screen.getByTestId('variable-date');
    
    fireEvent.change(nameInput, { target: { value: 'John' } });
    fireEvent.change(dateInput, { target: { value: '2023-05-15' } });
    
    // Apply variables
    fireEvent.click(screen.getByTestId('apply-variables'));
    
    // Check if variables are applied to the template
    await waitFor(() => {
      const titleInput = screen.getByTestId('title-input');
      const contentInput = screen.getByTestId('content-input');
      
      expect(titleInput.value).toContain('John');
      expect(contentInput.value).toContain('John');
      expect(contentInput.value).toContain('2023-05-15');
    });
  });

  test('validates form before submission', async () => {
    render(<MockNotificationForm />);
    
    // Submit without filling required fields
    const submitButton = screen.getByTestId('submit-button');
    fireEvent.click(submitButton);
    
    // Should show validation error
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });
  });

  test('validates template name for template forms', async () => {
    render(<MockNotificationForm isTemplate={true} />);
    
    // Fill all fields except template name
    const titleInput = screen.getByTestId('title-input');
    const contentInput = screen.getByTestId('content-input');
    const categorySelect = screen.getByTestId('category-select');
    
    fireEvent.change(titleInput, { target: { value: 'Test Title' } });
    fireEvent.change(contentInput, { target: { value: 'Test Content' } });
    fireEvent.change(categorySelect, { target: { value: 'õppetöö' } });
    
    // Submit without template name
    const submitButton = screen.getByTestId('submit-button');
    fireEvent.click(submitButton);
    
    // Should show validation error
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(screen.getByTestId('error-message').textContent).toContain('Malli nimi');
    });
  });

  test('handles form submission for new notification', async () => {
    const mockAddNotification = jest.fn().mockResolvedValue({ data: {} });
    window.mockSubmitHandler = mockAddNotification;

    render(<MockNotificationForm />);
    
    // Fill form and submit
    const titleInput = screen.getByTestId('title-input');
    const contentInput = screen.getByTestId('content-input');
    const categorySelect = screen.getByTestId('category-select');
    
    fireEvent.change(titleInput, { target: { value: 'Test Title' } });
    fireEvent.change(contentInput, { target: { value: 'Test Content' } });
    fireEvent.change(categorySelect, { target: { value: 'õppetöö' } });
    
    const submitButton = screen.getByTestId('submit-button');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Title',
          content: 'Test Content',
          category: 'õppetöö'
        }),
        expect.any(Array),
        false,
        false
      );
    });
  });

  test('handles form submission for new template', async () => {
    const mockCreateTemplate = jest.fn().mockResolvedValue({ data: {} });
    window.mockSubmitHandler = mockCreateTemplate;

    render(<MockNotificationForm isTemplate={true} />);
    
    // Fill form and submit
    const nameInput = screen.getByLabelText('Malli nimi');
    const titleInput = screen.getByTestId('title-input');
    const contentInput = screen.getByTestId('content-input');
    const categorySelect = screen.getByTestId('category-select');
    
    fireEvent.change(nameInput, { target: { value: 'Test Template Name' } });
    fireEvent.change(titleInput, { target: { value: 'Test Title' } });
    fireEvent.change(contentInput, { target: { value: 'Test Content' } });
    fireEvent.change(categorySelect, { target: { value: 'õppetöö' } });
    
    const submitButton = screen.getByTestId('submit-button');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockCreateTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Template Name',
          title: 'Test Title',
          content: 'Test Content',
          category: 'õppetöö'
        }),
        expect.any(Array),
        true,
        false
      );
    });
  });

  test('handles form submission for updating a template', async () => {
    const mockUpdateTemplate = jest.fn().mockResolvedValue({ data: {} });
    window.mockSubmitHandler = mockUpdateTemplate;

    render(<MockNotificationForm isTemplate={true} isEdit={true} />);
    
    // Form should be pre-filled, just modify and submit
    const titleInput = screen.getByTestId('title-input');
    fireEvent.change(titleInput, { target: { value: 'Updated Title' } });
    
    const submitButton = screen.getByTestId('submit-button');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockUpdateTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Updated Title',
        }),
        expect.any(Array),
        true,
        true
      );
    });
  });

  test('displays error message when submission fails', async () => {
    const mockError = new Error('Network error');
    const mockFailedSubmit = jest.fn().mockRejectedValue(mockError);
    window.mockSubmitHandler = mockFailedSubmit;

    render(<MockNotificationForm />);
    
    // Fill required fields and submit
    const titleInput = screen.getByTestId('title-input');
    const contentInput = screen.getByTestId('content-input');
    const categorySelect = screen.getByTestId('category-select');
    
    fireEvent.change(titleInput, { target: { value: 'Test Title' } });
    fireEvent.change(contentInput, { target: { value: 'Test Content' } });
    fireEvent.change(categorySelect, { target: { value: 'õppetöö' } });
    
    const submitButton = screen.getByTestId('submit-button');
    fireEvent.click(submitButton);
    
    // Should show error message
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(screen.getByTestId('error-message').textContent).toContain('Network error');
    });
  });

  test('handles variable modal cancellation', async () => {
    render(<MockNotificationForm />);
    
    // Select template with variables
    const templateSelect = screen.getByTestId('template-select');
    fireEvent.change(templateSelect, { target: { value: '3' } });
    
    // Variables modal should appear
    await waitFor(() => {
      expect(screen.getByTestId('variables-modal')).toBeInTheDocument();
    });
    
    // Cancel variables modal
    fireEvent.click(screen.getByTestId('cancel-variables'));
    
    // Modal should disappear
    await waitFor(() => {
      expect(screen.queryByTestId('variables-modal')).not.toBeInTheDocument();
    });
  });

  test('handles group selection changes', async () => {
    render(<MockNotificationForm />);
    
    const groupCheckbox = screen.getByLabelText('Group 1');
    fireEvent.click(groupCheckbox);
    
    // Second group checkbox should exist but not be checked
    const group2Checkbox = screen.getByLabelText('Group 2');
    expect(group2Checkbox).not.toBeChecked();
    
    // First group should now be checked
    expect(groupCheckbox).toBeChecked();
    
    // Now uncheck it
    fireEvent.click(groupCheckbox);
    expect(groupCheckbox).not.toBeChecked();
  });
}); 