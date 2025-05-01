import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaCopy, FaInfoCircle, FaUsers } from 'react-icons/fa';
import { 
  useGetTemplatesQuery, 
  useDeleteTemplateMutation,
  useGetTemplateByIdQuery
} from '../../services/api';
import ConfirmationModal from '../common/ConfirmationModal';
import './styles/Templates.css';

const TemplateList = () => {
  const navigate = useNavigate();
  const { data: templates = [], isLoading, refetch } = useGetTemplatesQuery();
  const [deleteTemplate] = useDeleteTemplateMutation();
  const [confirmationModal, setConfirmationModal] = useState({ show: false, templateId: null });
  const [showInfoModal, setShowInfoModal] = useState(false);

  const handleDeleteClick = (id) => {
    setConfirmationModal({ show: true, templateId: id });
  };

  const handleUseTemplate = (templateId) => {
    console.log('Using template:', templateId);
    // Navigate programmatically to ensure the parameter is properly passed
    navigate(`/notifications/new?template=${templateId}`);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteTemplate(confirmationModal.templateId).unwrap();
      setConfirmationModal({ show: false, templateId: null });
      refetch();
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const handleCancelDelete = () => {
    setConfirmationModal({ show: false, templateId: null });
  };

  if (isLoading) {
    return <div>Laadin malle...</div>;
  }

  return (
    <div className="template-list-container">
      <div className="template-header">
        <h2>Minu mallid</h2>
        <div className="template-header-actions">
          <button 
            className="info-button"
            onClick={() => setShowInfoModal(true)}
          >
            <FaInfoCircle /> Muutujad
          </button>
          <Link to="/templates/new" className="create-template-button">
            <FaPlus /> Uus mall
          </Link>
        </div>
      </div>
      
      {templates.length === 0 ? (
        <div className="empty-templates">
          <p>Sul pole veel malle. Loo uus mall, et kiirendada teadete loomist.</p>
          <Link to="/templates/new" className="create-template-button">
            <FaPlus /> Loo esimene mall
          </Link>
        </div>
      ) : (
        <div className="templates-grid">
          {templates.map(template => (
            <div key={template.id} className="template-card">
              <h3>{template.name}</h3>
              <div className="template-preview">
                <p className="template-title">{template.title}</p>
                <p className="template-category">{template.category}</p>
                <p className="template-priority">{template.priority}</p>
                {template.target_groups && template.target_groups.length > 0 ? (
                  <p className="template-groups">
                    <FaUsers className="groups-icon" />
                    {template.target_groups.length} sihtgruppi
                  </p>
                ) : (
                  <p className="template-groups">
                    <FaUsers className="groups-icon" />
                    Kõik grupid (avalik)
                  </p>
                )}
              </div>
              <div className="template-actions">
                <button 
                  className="action-button use-template"
                  onClick={() => handleUseTemplate(template.id)}
                >
                  <FaCopy /> Kasuta
                </button>
                <Link to={`/templates/edit/${template.id}`} className="action-button edit-template">
                  <FaEdit /> Muuda
                </Link>
                <button 
                  className="action-button delete-template" 
                  onClick={() => handleDeleteClick(template.id)}
                >
                  <FaTrash /> Kustuta
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      <ConfirmationModal
        open={confirmationModal.show}
        title="Kustuta mall"
        message="Kas oled kindel, et soovid selle malli kustutada?"
        confirmText="Kustuta"
        cancelText="Tühista"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      {/* Template info modal */}
      <ConfirmationModal
        open={showInfoModal}
        title="Mallide muutujate kasutamine"
        confirmText="Sulge"
        onConfirm={() => setShowInfoModal(false)}
        onCancel={() => setShowInfoModal(false)}
      >
        <div className="template-info-content">
          <p>Mallides saad kasutada muutujaid, mis asendatakse teate loomisel reaalse sisuga.</p>
          <h4>Kuidas kasutada:</h4>
          <ol>
            <li>Lisa mallile muutuja, kasutades loogelisi sulge, nt: <code>{"{kuupäev}"}</code></li>
            <li>Kui lood teadet selle malliga, avaneb dialoog, kus saad sisestada väärtuse igale muutujale</li>
            <li>Sama nimega muutujad asendatakse kõik sama väärtusega</li>
          </ol>
          <h4>Näidis:</h4>
          <p>Kui mallil on sisu:</p>
          <pre>Koosolek toimub {"{kuupäev}"} kell {"{kellaaeg}"}. Koht: {"{koht}"}. <br/>Kordan, {"{kuupäev}"} kell {"{kellaaeg}"}!</pre>
          <p>Siis peale väärtuste sisestamist võib teade välja näha nii:</p>
          <pre>Koosolek toimub 15.08.2023 kell 14:00. Koht: Ruum 305. <br/>Kordan, 15.08.2023 kell 14:00!</pre>
        </div>
      </ConfirmationModal>
    </div>
  );
};

export default TemplateList; 