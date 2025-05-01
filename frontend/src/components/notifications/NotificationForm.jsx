// src/components/NotificationForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import './styles/NotificationForm.css';
import { 
  useAddNotificationMutation, 
  useGetGroupsQuery, 
  useCreateTemplateMutation,
  useUpdateTemplateMutation,
  useGetTemplateByIdQuery,
  useGetTemplatesQuery
} from '../../services/api';
import NotificationFormFields from './NotificationFormFields';
import ConfirmationModal from '../common/ConfirmationModal';

// Template variables modal content
const TemplateVariablesForm = ({ variables, values, onChange }) => (
  <div className="template-variables-form">
    {Object.entries(variables).map(([variable, _]) => (
      <div className="form-group" key={variable}>
        <label htmlFor={variable} className="variable-label">{variable}</label>
        <input
          type="text"
          id={variable}
          name={variable}
          value={values[variable]}
          onChange={onChange}
          className="form-control"
          placeholder={`Sisesta väärtus muutujale {${variable}}`}
        />
      </div>
    ))}
  </div>
);

const NotificationForm = ({ isTemplate = false, isEdit = false }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    priority: 'tavaline',
    name: '' // For templates only
  });
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [error, setError] = useState('');
  const [showVariableModal, setShowVariableModal] = useState(false);
  const [templateVariables, setTemplateVariables] = useState({});
  const [variableValues, setVariableValues] = useState({});
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const templateIdFromUrl = searchParams.get('template');
  const { user } = useSelector(state => state.auth);
  
  // Always call hooks unconditionally, but conditionally use their results
  const { data: groups = [], isLoading: groupsLoading } = useGetGroupsQuery();
  const [addNotification, { isLoading: addNotificationLoading }] = useAddNotificationMutation();
  const [createTemplate, { isLoading: createTemplateLoading }] = useCreateTemplateMutation();
  const [updateTemplate, { isLoading: updateTemplateLoading }] = useUpdateTemplateMutation();
  
  // Always call the hooks, but skip requests when not needed
  const skipTemplateDataFetch = !(isEdit && isTemplate && id);
  const { data: templateData, isLoading: templateLoading, error: templateError } = useGetTemplateByIdQuery(id || 0, {
    skip: skipTemplateDataFetch
  });

  // Add more debugging info to help us trace the template loading issue
  console.log('NotificationForm component rendering with params:', {
    isTemplate,
    isEdit,
    id,
    templateIdFromUrl,
    searchParamsString: searchParams.toString(),
    searchParams: Object.fromEntries(searchParams.entries())
  });

  // Load template if template ID is in the URL
  const skipTemplateFromUrlFetch = !(!isTemplate && templateIdFromUrl);
  const templateIdInt = templateIdFromUrl ? parseInt(templateIdFromUrl, 10) : 0;
  
  console.log('Template query params:', {
    templateIdFromUrl,
    templateIdInt,
    skipTemplateFromUrlFetch
  });
  
  const { 
    data: templateFromUrl, 
    isLoading: templateFromUrlLoading, 
    error: templateFromUrlError 
  } = useGetTemplateByIdQuery(
    templateIdInt, 
    { 
      skip: skipTemplateFromUrlFetch,
      // Force refetch when switching templates
      refetchOnMountOrArgChange: true
    }
  );

  // Get all templates for template selection dropdown
  const skipTemplatesFetch = isTemplate;
  const { data: templates = [], isLoading: templatesLoading } = useGetTemplatesQuery(undefined, {
    skip: skipTemplatesFetch
  });
  
  // Print debug info for template loading
  useEffect(() => {
    if (templateIdFromUrl) {
      console.log('Loading template from URL:', templateIdFromUrl);
      console.log('Template loading state:', {
        loading: templateFromUrlLoading,
        error: templateFromUrlError,
        data: templateFromUrl
      });
    }
  }, [templateIdFromUrl, templateFromUrl, templateFromUrlLoading, templateFromUrlError]);

  // Function to extract template variables from content
  const extractTemplateVariables = (title, content) => {
    const variableRegex = /{([^{}]+)}/g;
    const variables = new Set();
    
    // Extract variables from title
    let match;
    if (title) {
      while ((match = variableRegex.exec(title)) !== null) {
        variables.add(match[1]);
      }
      
      // Reset regex lastIndex
      variableRegex.lastIndex = 0;
    }
    
    // Extract variables from content
    if (content) {
      while ((match = variableRegex.exec(content)) !== null) {
        variables.add(match[1]);
      }
    }
    
    // Convert Set to object with empty values
    const variablesObj = {};
    variables.forEach(variable => {
      variablesObj[variable] = '';
    });
    
    return variablesObj;
  };

  // Apply variable values to template content
  const applyVariablesToTemplate = (title, content, values) => {
    let newTitle = title || '';
    let newContent = content || '';
    
    Object.entries(values).forEach(([variable, value]) => {
      const regex = new RegExp(`{${variable}}`, 'g');
      newTitle = newTitle.replace(regex, value);
      newContent = newContent.replace(regex, value);
    });
    
    return { title: newTitle, content: newContent };
  };

  // Set form data from template when editing
  useEffect(() => {
    if (isEdit && isTemplate && templateData) {
      setFormData({
        name: templateData.name,
        title: templateData.title,
        content: templateData.content,
        category: templateData.category || '',
        priority: templateData.priority || 'tavaline'
      });
    }
  }, [isEdit, isTemplate, templateData]);

  // Set form data when a template is selected from URL parameter
  useEffect(() => {
    if (!isTemplate && templateIdFromUrl && !templateFromUrlLoading) {
      // If we have an error loading the template, show error message
      if (templateFromUrlError) {
        console.error('Error loading template from URL:', templateFromUrlError);
        setError('Malliga tekkis probleem. Palun proovi mõnda teist malli või logi välja ja sisse tagasi.');
        return;
      }
      
      // If the template is loaded successfully
      if (templateFromUrl) {
        console.log('Template from URL loaded successfully:', templateFromUrl);
        
        // Check for template variables
        const variables = extractTemplateVariables(templateFromUrl.title, templateFromUrl.content);
        console.log('Extracted variables:', variables);
        
        if (Object.keys(variables).length > 0) {
          // Store template data and variables
          setTemplateVariables(variables);
          setVariableValues(variables);
          setShowVariableModal(true);
        } else {
          // No variables, just set the form data directly
          setFormData({
            title: templateFromUrl.title,
            content: templateFromUrl.content,
            category: templateFromUrl.category || '',
            priority: templateFromUrl.priority || 'tavaline'
          });
        }
      }
    }
  }, [isTemplate, templateFromUrl, templateIdFromUrl, templateFromUrlError, templateFromUrlLoading]);

  // Add a special backup method to load template directly
  useEffect(() => {
    // If we're not in template mode but have a template ID in URL and template failed to load
    if (!isTemplate && templateIdFromUrl && templateFromUrlError) {
      console.log('Template failed to load via URL, trying direct fetch', templateIdFromUrl);
      
      const fetchTemplate = async () => {
        try {
          // Get token from localStorage
          const token = localStorage.getItem('token');
          if (!token) {
            console.error('No token available for direct template fetch');
            setError('Autentimise probleem. Palun logi välja ja sisse tagasi.');
            return;
          }
          
          // Make direct fetch request
          const response = await fetch(`http://localhost:5000/api/templates/${templateIdFromUrl}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!response.ok) {
            throw new Error(`Template fetch failed: ${response.status} ${response.statusText}`);
          }
          
          const template = await response.json();
          console.log('Direct template fetch succeeded:', template);
          
          // Check for template variables
          const variables = extractTemplateVariables(template.title, template.content);
          console.log('Extracted variables from direct fetch:', variables);
          
          if (Object.keys(variables).length > 0) {
            // Store template data and variables
            setTemplateVariables(variables);
            setVariableValues(variables);
            setShowVariableModal(true);
          } else {
            // No variables, just set the form data directly
            setFormData({
              title: template.title,
              content: template.content,
              category: template.category || '',
              priority: template.priority || 'tavaline'
            });
          }
        } catch (error) {
          console.error('Direct template fetch failed:', error);
          setError(`Malliga tekkis probleem: ${error.message}`);
        }
      };
      
      fetchTemplate();
    }
  }, [isTemplate, templateIdFromUrl, templateFromUrlError]);

  // Debug: log groups when they change
  useEffect(() => {
    console.log('Available groups:', groups);
  }, [groups]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGroupChange = (newSelectedGroups) => {
    console.log('Selected groups changed to:', newSelectedGroups);
    setSelectedGroups(newSelectedGroups);
  };

  // Fix the dropdown value issue
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  // Set the initial template ID from URL if present  
  useEffect(() => {
    if (templateIdFromUrl) {
      setSelectedTemplateId(templateIdFromUrl);
    }
  }, [templateIdFromUrl]);

  // Handle template selection from dropdown
  const handleTemplateSelect = (e) => {
    const newTemplateId = e.target.value;
    console.log('Template dropdown selection changed to:', newTemplateId);
    
    // Update the selected template ID state
    setSelectedTemplateId(newTemplateId);
    
    if (!newTemplateId) {
      // Reset form if "No template" is selected
      setFormData({
        title: '',
        content: '',
        category: '',
        priority: 'tavaline',
      });
      return;
    }
    
    // Find the selected template
    const selectedTemplateId_int = parseInt(newTemplateId, 10);
    const selectedTemplate = templates.find(t => t.id === selectedTemplateId_int);
    
    console.log('Selected template from dropdown:', {
      selectedTemplateId, 
      selectedTemplateId_int,
      template: selectedTemplate
    });
    
    if (selectedTemplate) {
      // Check for template variables
      const variables = extractTemplateVariables(selectedTemplate.title, selectedTemplate.content);
      console.log('Extracted variables from dropdown:', variables);
      
      if (Object.keys(variables).length > 0) {
        // Store template data and variables
        setTemplateVariables(variables);
        setVariableValues(variables);
        setShowVariableModal(true);
      } else {
        // No variables, just set the form data directly
        setFormData({
          title: selectedTemplate.title,
          content: selectedTemplate.content,
          category: selectedTemplate.category || '',
          priority: selectedTemplate.priority || 'tavaline'
        });
      }
    }
  };

  const handleVariableChange = (e) => {
    const { name, value } = e.target;
    setVariableValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleVariableSubmit = () => {
    console.log('Variable submit button clicked');
    
    // Get the template data from either URL param or dropdown selection
    let templateSource = null;
    
    if (templateFromUrl) {
      // Template from URL
      templateSource = templateFromUrl;
      console.log('Using template from URL:', templateSource);
    } else {
      // Template from dropdown
      const templateId = selectedTemplateId;
      console.log('Looking for template with ID:', templateId);
      
      if (templateId) {
        const selectedTemplate = templates.find(t => t.id === parseInt(templateId, 10));
        console.log('Found template from dropdown:', selectedTemplate);
        templateSource = selectedTemplate;
      }
    }
    
    console.log('Template source for variables:', templateSource);
    console.log('Variable values to apply:', variableValues);
    
    if (templateSource) {
      // Apply variable values to template
      const processedContent = applyVariablesToTemplate(
        templateSource.title,
        templateSource.content,
        variableValues
      );
      
      console.log('Processed template content:', processedContent);
      
      // Update form data with processed content
      const newData = {
        title: processedContent.title,
        content: processedContent.content,
        category: templateSource.category || '',
        priority: templateSource.priority || 'tavaline'
      };
      
      console.log('Setting form data from template with variables:', newData);
      setFormData(newData);
    } else {
      console.error('No template source found for variable replacement');
    }
    
    // Close the modal
    setShowVariableModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isTemplate) {
        // Template creation or update
        const templatePayload = {
          name: formData.name,
          title: formData.title,
          content: formData.content,
          category: formData.category,
          priority: formData.priority
        };
        
        if (isEdit) {
          // Update existing template
          await updateTemplate({
            id,
            ...templatePayload
          }).unwrap();
        } else {
          // Create new template
          await createTemplate(templatePayload).unwrap();
        }
        navigate('/templates');
      } else {
        // Regular notification creation
        console.log('Submitting notification with groups:', selectedGroups);
        await addNotification({
          title: formData.title,
          content: formData.content,
          category: formData.category,
          priority: formData.priority,
          createdBy: user.id,
          targetGroups: selectedGroups.length > 0 ? selectedGroups : null
        }).unwrap();
        navigate('/');
      }
    } catch (err) {
      setError(isTemplate ? 'Viga malli salvestamisel' : 'Viga teate lisamisel');
      console.error(err);
    }
  };

  const isSubmitting = addNotificationLoading || createTemplateLoading || updateTemplateLoading || templateLoading || groupsLoading || templateFromUrlLoading || templatesLoading;

  // Determine page title and button text based on mode
  const getPageTitle = () => {
    if (isTemplate) {
      return isEdit ? 'Muuda malli' : 'Lisa uus mall';
    }
    return 'Lisa uus teade';
  };

  const getSubmitButtonText = () => {
    if (isTemplate) {
      return isEdit ? 'Salvesta muudatused' : 'Lisa mall';
    }
    return 'Lisa teade';
  };

  const getLoadingText = () => {
    if (isTemplate) {
      return isEdit ? 'Salvestan muudatusi...' : 'Lisan malli...';
    }
    return 'Lisan teadet...';
  };

  // Add user authentication status debugging
  console.log('User authentication status:', {
    isAuthenticated: !!user,
    userId: user?.id,
    hasToken: !!localStorage.getItem('token')
  });

  return (
    <div className="notification-form">
      <h2>{getPageTitle()}</h2>
      {!isTemplate && groups.length === 0 && !groupsLoading && (
        <div className="warning-message">Hoiatus: Grupid ei ole laaditud. Võimalik API viga.</div>
      )}
      {error && (
        <div className="error-message">{error}</div>
      )}
      <form onSubmit={handleSubmit}>
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
            <small className="form-text text-muted">
              See nimi on nähtav ainult sulle ja aitab malle eristada
            </small>
          </div>
        )}

        {/* Template selection dropdown for notifications */}
        {!isTemplate && !isEdit && (
          <div className="form-group">
            <label htmlFor="templateSelect">Vali mall (valikuline)</label>
            <select
              id="templateSelect"
              name="templateSelect"
              className="form-select"
              onChange={handleTemplateSelect}
              value={selectedTemplateId}
            >
              <option value="">Mallist loobumine</option>
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
            <small className="form-text text-muted">
              Malli kasutamine eeltäidab teate väljad. Saad neid muuta enne saatmist.
            </small>
          </div>
        )}

        <NotificationFormFields
          formData={formData}
          handleChange={handleChange}
          error={error}
          isSubmitting={isSubmitting}
          submitButtonText={getSubmitButtonText()}
          loadingText={getLoadingText()}
          availableGroups={!isTemplate ? groups : []}
          selectedGroups={selectedGroups}
          handleGroupChange={handleGroupChange}
          showGroupSelection={!isTemplate}
        />
      </form>

      {/* Template Variables Modal using the shared component */}
      <ConfirmationModal
        open={showVariableModal}
        title="Täida malli muutujad"
        message="Palun määra väärtused järgmistele muutujatele:"
        confirmText="Kinnita"
        cancelText="Tühista"
        onConfirm={handleVariableSubmit}
        onCancel={() => {
          setShowVariableModal(false);
          // If this is from URL, navigate back to templates
          if (templateIdFromUrl) {
            navigate('/templates');
          }
        }}
      >
        <TemplateVariablesForm 
          variables={templateVariables}
          values={variableValues}
          onChange={handleVariableChange}
        />
      </ConfirmationModal>
    </div>
  );
};

export default NotificationForm;
