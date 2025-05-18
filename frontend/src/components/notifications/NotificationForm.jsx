// src/components/NotificationForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
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
    name: ''
  });
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [error, setError] = useState('');
  const [showVariableModal, setShowVariableModal] = useState(false);
  const [templateVariables, setTemplateVariables] = useState({});
  const [variableValues, setVariableValues] = useState({});
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const templateIdFromUrl = searchParams.get('template');
  const { user } = useSelector(state => state.auth);
  
  const { data: groups = [], isLoading: groupsLoading } = useGetGroupsQuery();
  const [addNotification, { isLoading: addNotificationLoading }] = useAddNotificationMutation();
  const [createTemplate, { isLoading: createTemplateLoading }] = useCreateTemplateMutation();
  const [updateTemplate, { isLoading: updateTemplateLoading }] = useUpdateTemplateMutation();
  
  const skipTemplateDataFetch = !(isEdit && isTemplate && id);
  const { data: templateData, isLoading: templateLoading } = useGetTemplateByIdQuery(id || 0, {
    skip: skipTemplateDataFetch
  });

  const skipTemplateFromUrlFetch = !(!isTemplate && templateIdFromUrl);
  const templateIdInt = templateIdFromUrl ? parseInt(templateIdFromUrl, 10) : 0;
  
  const { 
    data: templateFromUrl, 
    isLoading: templateFromUrlLoading, 
    error: templateFromUrlError 
  } = useGetTemplateByIdQuery(
    templateIdInt, 
    { 
      skip: skipTemplateFromUrlFetch,
      refetchOnMountOrArgChange: true
    }
  );

  const skipTemplatesFetch = isTemplate;
  const { data: templates = [], isLoading: templatesLoading } = useGetTemplatesQuery(undefined, {
    skip: skipTemplatesFetch
  });

  const extractTemplateVariables = (title, content) => {
    const variableRegex = /{([^{}]+)}/g;
    const variables = new Set();
    
    let match;
    if (title) {
      while ((match = variableRegex.exec(title)) !== null) {
        variables.add(match[1]);
      }
      
      variableRegex.lastIndex = 0;
    }
    
    if (content) {
      while ((match = variableRegex.exec(content)) !== null) {
        variables.add(match[1]);
      }
    }
    
    const variablesObj = {};
    variables.forEach(variable => {
      variablesObj[variable] = '';
    });
    
    return variablesObj;
  };

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

  useEffect(() => {
    if (isEdit && isTemplate && templateData) {
      setFormData({
        name: templateData.name,
        title: templateData.title,
        content: templateData.content,
        category: templateData.category || '',
        priority: templateData.priority || 'tavaline'
      });
      
      if (templateData.target_groups && templateData.target_groups.length > 0) {
        setSelectedGroups(templateData.target_groups.map(group => group.id));
      }
    }
  }, [isEdit, isTemplate, templateData]);

  useEffect(() => {
    if (!isTemplate && templateIdFromUrl && !templateFromUrlLoading) {
      if (templateFromUrlError) {
        setError('Malliga tekkis probleem. Palun proovi mõnda teist malli või logi välja ja sisse tagasi.');
        return;
      }
      
      if (templateFromUrl) {
        if (templateFromUrl.target_groups && templateFromUrl.target_groups.length > 0) {
          setSelectedGroups(templateFromUrl.target_groups.map(group => group.id));
        }
        
        const variables = extractTemplateVariables(templateFromUrl.title, templateFromUrl.content);
        
        if (Object.keys(variables).length > 0) {
          setTemplateVariables(variables);
          setVariableValues(variables);
          setShowVariableModal(true);
        } else {
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

  useEffect(() => {
    if (!isTemplate && templateIdFromUrl && templateFromUrlError) {
      const fetchTemplate = async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            setError('Autentimise probleem. Palun logi välja ja sisse tagasi.');
            return;
          }
          
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
          
          const variables = extractTemplateVariables(template.title, template.content);
          
          if (Object.keys(variables).length > 0) {
            setTemplateVariables(variables);
            setVariableValues(variables);
            setShowVariableModal(true);
          } else {
            setFormData({
              title: template.title,
              content: template.content,
              category: template.category || '',
              priority: template.priority || 'tavaline'
            });
          }
        } catch (error) {
          setError(`Malliga tekkis probleem: ${error.message}`);
        }
      };
      
      fetchTemplate();
    }
  }, [isTemplate, templateIdFromUrl, templateFromUrlError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGroupChange = (newSelectedGroups) => {
    setSelectedGroups(newSelectedGroups);
  };

  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  useEffect(() => {
    if (templateIdFromUrl) {
      setSelectedTemplateId(templateIdFromUrl);
    }
  }, [templateIdFromUrl]);

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
    
    const selectedTemplateId_int = parseInt(newTemplateId, 10);
    const selectedTemplate = templates.find(t => t.id === selectedTemplateId_int);
    
    if (selectedTemplate) {
      const variables = extractTemplateVariables(selectedTemplate.title, selectedTemplate.content);
      
      if (Object.keys(variables).length > 0) {
        setTemplateVariables(variables);
        setVariableValues(variables);
        setShowVariableModal(true);
      } else {
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
    let templateSource = null;
    
    if (templateFromUrl) {
      templateSource = templateFromUrl;
    } else {
      const templateId = selectedTemplateId;
      
      if (templateId) {
        const selectedTemplate = templates.find(t => t.id === parseInt(templateId, 10));
        templateSource = selectedTemplate;
      }
    }
    
    if (templateSource) {
      const processedContent = applyVariablesToTemplate(
        templateSource.title,
        templateSource.content,
        variableValues
      );
      
      const newData = {
        title: processedContent.title,
        content: processedContent.content,
        category: templateSource.category || '',
        priority: templateSource.priority || 'tavaline'
      };
      
      setFormData(newData);
    } else {
      setError('Malli andmete laadimisel tekkis probleem.');
    }
    
    setShowVariableModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isTemplate) {
        const templatePayload = {
          name: formData.name,
          title: formData.title,
          content: formData.content,
          category: formData.category,
          priority: formData.priority,
          targetGroups: selectedGroups.length > 0 ? selectedGroups : null
        };
        
        if (isEdit) {
          await updateTemplate({
            id,
            ...templatePayload
          }).unwrap();
        } else {
          await createTemplate(templatePayload).unwrap();
        }
        navigate('/templates');
      } else {
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
      const errorMessage = err.data?.error || err.message || 'Midagi läks valesti';
      setError(isTemplate 
        ? `Viga malli salvestamisel: ${errorMessage}` 
        : `Viga teate lisamisel: ${errorMessage}`);
    }
  };

  const isSubmitting = addNotificationLoading || createTemplateLoading || updateTemplateLoading || templateLoading || groupsLoading || templateFromUrlLoading || templatesLoading;

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
          availableGroups={groups}
          selectedGroups={selectedGroups}
          handleGroupChange={handleGroupChange}
          showGroupSelection={true}
        />
      </form>

      <ConfirmationModal
        open={showVariableModal}
        title="Täida malli muutujad"
        message="Palun määra väärtused järgmistele muutujatele:"
        confirmText="Kinnita"
        cancelText="Tühista"
        onConfirm={handleVariableSubmit}
        onCancel={() => {
          setShowVariableModal(false);
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
