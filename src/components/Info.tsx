import React from 'react';
import { isMobile } from '../utils';

interface InfoModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
  /** 为 false 时不显示「确定」按钮（例如保存进行中） */
  showConfirmButton?: boolean;
  /** 为 true 时点击遮罩不关闭 */
  blockBackdropClose?: boolean;
}

const InfoModal: React.FC<InfoModalProps> = ({
  isOpen,
  title,
  message,
  onClose,
  showConfirmButton = true,
  blockBackdropClose = false
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="modal"
      style={{ display: 'block', zIndex: 99999 }}
      onClick={e => {
        if (e.target === e.currentTarget && !blockBackdropClose) onClose();
      }}
    >
      <div className="modal-content" style={isMobile() ? { width: '98%', padding: 10 } : {}}>
        <div className="modal-header">
          <h3>{title}</h3>
        </div>
        <div className="modal-body">
          <p style={{ 
            margin: '10px 0', 
            padding: '15px', 
            background: 'rgba(255, 255, 255, 0.1)', 
            borderRadius: 12,
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            color: '#fff',
            fontSize: '16px',
            lineHeight: '1.5'
          }}>
            {message}
          </p>
        </div>
        {showConfirmButton && (
          <div className="modal-buttons">
            <button className="btn btn-primary" onClick={onClose}>确定</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InfoModal; 
