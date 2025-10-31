import React, { useState, useEffect, useRef } from 'react';
import { NotificationMethod, Domain } from '../types';
import { 
  exportDomainsToJSON, 
  exportDomainsToCSV, 
  exportDomainsToTXT, 
  importDomainsFromFile, 
  validateDomainData 
} from '../utils';
import { verifyAdminPassword, importCloudflareDomains } from '../api';
import PasswordModal from './Password';
import ConfirmModal from './Confirm';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  warningDays: string;
  notificationEnabled: string;
  notificationInterval: string;
  notificationMethods: NotificationMethod[];
  bgImageUrl: string;
  carouselInterval: number;
  carouselEnabled: boolean;
  telegramBotToken?: string;
  telegramChatId?: string;
  wechatSendKey?: string;
  qqKey?: string;
  domains: Domain[];
  onSave: (settings: {
    warningDays: string;
    notificationEnabled: string;
    notificationInterval: string;
    notificationMethods: NotificationMethod[];
    bgImageUrl: string;
    carouselInterval: number;
    carouselEnabled: boolean;
    telegramBotToken?: string;
    telegramChatId?: string;
    wechatSendKey?: string;
    qqKey?: string;
  }) => void;
  onImportDomains: (domains: Domain[]) => void;
  onWebDAVBackup?: () => Promise<void>;
  onWebDAVRestore?: () => Promise<void>;
  onOpenLogs?: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  warningDays,
  notificationEnabled,
  notificationInterval,
  notificationMethods,
  bgImageUrl,
  carouselInterval,
  carouselEnabled,
  domains,
  onSave,
  onImportDomains,
  onWebDAVBackup,
  onWebDAVRestore,
  onOpenLogs
}) => {
  const [form, setForm] = useState({
    warningDays,
    notificationEnabled,
    notificationInterval,
    notificationMethods: [...notificationMethods],
    bgImageUrl,
    carouselInterval,
    carouselEnabled,
    telegramBotToken: '',
    telegramChatId: '',
    wechatSendKey: '',
    qqKey: ''
  });

  const [importError, setImportError] = useState<string>('');
  const [importSuccess, setImportSuccess] = useState<string>('');
  const [webdavError, setWebdavError] = useState<string>('');
  const [webdavSuccess, setWebdavSuccess] = useState<string>('');
  const [webdavLoading, setWebdavLoading] = useState(false);
  const [cloudflareLoading, setCloudflareLoading] = useState(false);
  const [cloudflareError, setCloudflareError] = useState<string>('');
  const [cloudflareSuccess, setCloudflareSuccess] = useState<string>('');
  const [passwordModal, setPasswordModal] = useState(false);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error'>('success');

  // 注意：环境变量配置现在由后端API处理
  // 前端只需要提供手动配置选项
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgUploadRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setForm({
        warningDays,
        notificationEnabled,
        notificationInterval,
        notificationMethods: [...notificationMethods],
        bgImageUrl,
        carouselInterval,
        carouselEnabled,
        telegramBotToken: '',
        telegramChatId: '',
        wechatSendKey: '',
        qqKey: ''
      });
    }
  }, [isOpen, warningDays, notificationEnabled, notificationInterval, notificationMethods, bgImageUrl, carouselInterval, carouselEnabled]);

  // 处理文件导入
  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError('');
    setImportSuccess('');

    try {
      const importedDomains = await importDomainsFromFile(file);
      const validation = validateDomainData(importedDomains);
      
      if (!validation.valid) {
        setImportError(`数据验证失败:\n${validation.errors.join('\n')}`);
        return;
      }

      onImportDomains(importedDomains);
      setImportSuccess(`成功导入 ${importedDomains.length} 个域名`);
      
      // 清空文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setImportError(error instanceof Error ? error.message : '导入失败');
    }
  };

  // 处理导出
  const handleExport = (format: 'json' | 'csv' | 'txt') => {
    try {
      switch (format) {
        case 'json':
          exportDomainsToJSON(domains);
          break;
        case 'csv':
          exportDomainsToCSV(domains);
          break;
        case 'txt':
          exportDomainsToTXT(domains);
          break;
      }
    } catch {
      setImportError('导出失败');
    }
  };

  // 处理WebDAV备份
  const handleWebDAVBackup = async () => {
    setWebdavLoading(true);
    setWebdavError('');
    setWebdavSuccess('');

    try {
      if (onWebDAVBackup) {
        await onWebDAVBackup();
        setWebdavSuccess('WebDAV备份成功');
      }
    } catch (error) {
      setWebdavError(error instanceof Error ? error.message : '备份失败');
    } finally {
      setWebdavLoading(false);
    }
  };

    // 处理WebDAV恢复
  const handleWebDAVRestore = async () => {
    setWebdavLoading(true);
    setWebdavError('');
    setWebdavSuccess('');
    
    try {
      if (onWebDAVRestore) {
        await onWebDAVRestore();
        setWebdavSuccess('WebDAV恢复成功');
      }
    } catch (error) {
      setWebdavError(error instanceof Error ? error.message : '恢复失败');
    } finally {
      setWebdavLoading(false);
    }
  };

  // 处理Cloudflare导入
  const handleCloudflareImport = async () => {
    setCloudflareLoading(true);
    setCloudflareError('');
    setCloudflareSuccess('');
    
    try {
      // 直接调用API，后端会从环境变量获取API密钥
      const result = await importCloudflareDomains();
      
      if (result.domains) {
        onImportDomains(result.domains);
        setCloudflareSuccess(`成功导入 ${result.stats?.total || result.domains.length} 个域名`);
      }
    } catch (error) {
      setCloudflareError(error instanceof Error ? error.message : '导入失败');
    } finally {
      setCloudflareLoading(false);
    }
  };



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  const handleNotificationMethodChange = (method: string, enabled: boolean) => {
    setForm(prev => ({
      ...prev,
      notificationMethods: enabled
        ? [...prev.notificationMethods, method as NotificationMethod]
        : prev.notificationMethods.filter(m => m !== method)
    }));
  };

  const handleLogsPasswordConfirm = async (password: string) => {
    try {
      const isValid = await verifyAdminPassword(password);
      
      if (!isValid) {
        setAlertMessage('管理员密码不正确，请重试');
        setAlertType('error');
        setAlertModal(true);
        return;
      }
      
      // 密码验证成功，打开日志模态框
      setPasswordModal(false);
      if (onOpenLogs) {
        onOpenLogs();
      }
      
    } catch (error: any) {
      console.error('密码验证失败:', error);
      const errorMessage = error.message || '密码验证过程中发生错误';
      setAlertMessage(`验证失败: ${errorMessage}`);
      setAlertType('error');
      setAlertModal(true);
    }
  };

  const handleLogsPasswordCancel = () => {
    setPasswordModal(false);
  };

  const handleAlertClose = () => {
    setAlertModal(false);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay settings-modal-overlay" onClick={onClose}>
      <div className="modal-content settings-modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header settings-modal-header">
          <h2>⚙️ 设置</h2>
          <button className="modal-close settings-modal-close" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body settings-modal-body">
            
            <div className="settings-section">
              <h3>🔔 通知设置</h3>
              
              <div className="form-group toggle-group">
                <label className="toggle-label">
                  <span className="toggle-text">启用到期提醒</span>
                  <div className="toggle-switch">
                    <input
                      id="notification-enabled"
                      type="checkbox"
                      className="toggle-input"
                      checked={form.notificationEnabled === 'true'}
                      onChange={e => setForm(prev => ({ ...prev, notificationEnabled: e.target.checked ? 'true' : 'false' }))}
                    />
                    <span className="toggle-slider"></span>
                  </div>
                </label>
              </div>

              <div className="form-group">
                <label className="form-label">提前提醒天数：</label>
                <input
                  id="warning-days"
                  type="number"
                  className="form-input"
                  min="1"
                  max="365"
                  value={form.warningDays}
                  onChange={e => setForm(prev => ({ ...prev, warningDays: e.target.value }))}
                  disabled={form.notificationEnabled !== 'true'}
                />
              </div>

              <div className="form-group">
                <label className="form-label">提醒频率：</label>
                <select
                  id="notification-interval"
                  className="form-select"
                  value={form.notificationInterval}
                  onChange={e => setForm(prev => ({ ...prev, notificationInterval: e.target.value }))}
                  disabled={form.notificationEnabled !== 'true'}
                >
                  <option value="daily">每天</option>
                  <option value="weekly">每周</option>
                  <option value="monthly">每月</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">通知方式：</label>
                <div className="checkbox-group notification-methods">
                  <label className="notification-method telegram-method">
                    <input
                      id="notification-telegram"
                      type="checkbox"
                      checked={form.notificationMethods.includes('telegram')}
                      onChange={e => handleNotificationMethodChange('telegram', e.target.checked)}
                      disabled={form.notificationEnabled !== 'true'}
                    />
                    <span>📱 Telegram</span>
                  </label>
                  <label className="notification-method wechat-method">
                    <input
                      id="notification-wechat"
                      type="checkbox"
                      checked={form.notificationMethods.includes('wechat')}
                      onChange={e => handleNotificationMethodChange('wechat', e.target.checked)}
                      disabled={form.notificationEnabled !== 'true'}
                    />
                    <span>💬 微信 (Server酱)</span>
                  </label>
                  <label className="notification-method qq-method">
                    <input
                      id="notification-qq"
                      type="checkbox"
                      checked={form.notificationMethods.includes('qq')}
                      onChange={e => handleNotificationMethodChange('qq', e.target.checked)}
                      disabled={form.notificationEnabled !== 'true'}
                    />
                    <span>🐧 QQ (Qmsg酱)</span>
                  </label>
                </div>
              </div>

              
              {form.notificationMethods.length > 0 && (
                <div className="notification-config">
                  <div className="form-group">
                    <small className="form-hint">
                      💡 请添加通知环境变量
                    </small>
                  </div>
                </div>
              )}
            </div>

            
            <div className="settings-section">
              <h3>🎨 背景设置</h3>
              
              <div className="form-group">
                <label className="form-label">自定义背景图片URL：</label>
                <input
                  id="bg-image-url"
                  type="url"
                  className="form-input"
                  placeholder="https://example.com/image.webp"
                  value={form.bgImageUrl}
                  onChange={e => setForm(prev => ({ ...prev, bgImageUrl: e.target.value }))}
                />
                <small className="form-hint">留空则使用轮播背景</small>
              </div>

              <div className="form-group">
                <label className="form-label">或从本地上传：</label>
                <input
                  ref={bgUploadRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    // 限制大小为 5MB，避免本地存储过大
                    if (file.size > 5 * 1024 * 1024) {
                      alert('图片过大，请选择小于 5MB 的图片');
                      return;
                    }
                    // 读取为 dataURL 并上传到后端，返回可缓存的公开URL
                    const reader = new FileReader();
                    reader.onload = async () => {
                      try {
                        const dataUrl = reader.result as string;
                        const resp = await fetch('/api/backg', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ dataUrl, filename: file.name })
                        });
                        const data = await resp.json();
                        if (!resp.ok || !data.success) throw new Error(data.error || '上传失败');
                        const url = data.url as string;
                        setForm(prev => ({ ...prev, bgImageUrl: url, carouselEnabled: false }));
                      } catch (err) {
                        alert('上传失败，请稍后再试');
                      }
                    };
                    reader.readAsDataURL(file);
                    // 重置 input 以便可重复选择同一文件
                    e.currentTarget.value = '';
                  }}
                />
                <div className="export-buttons" style={{ gap: 8 }}>
                  <button
                    type="button"
                    className="btn btn-export"
                    onClick={() => bgUploadRef.current?.click()}
                  >
                    📤 上传本地图片
                  </button>
                  {form.bgImageUrl && (
                    <button
                      type="button"
                      className="btn btn-export"
                      onClick={() => setForm(prev => ({ ...prev, bgImageUrl: '', carouselEnabled: true }))}
                    >
                      ✖ 清除背景
                    </button>
                  )}
                </div>
                <small className="form-hint">支持任意图片格式，建议 ≤ 5MB；保存后自动持久化</small>
              </div>

              <div className="form-group toggle-group">
                <label className="toggle-label">
                  <span className="toggle-text">开启背景图轮播</span>
                  <div className="toggle-switch">
                    <input
                      id="carousel-enabled"
                      type="checkbox"
                      className="toggle-input"
                      checked={form.carouselEnabled}
                      onChange={e => setForm(prev => ({ ...prev, carouselEnabled: e.target.checked }))}
                    />
                    <span className="toggle-slider"></span>
                  </div>
                </label>
              </div>

              <div className="form-group">
                <label className="form-label">轮播间隔（秒）：</label>
                <input
                  id="carousel-interval"
                  type="number"
                  className="form-input"
                  min="5"
                  max="300"
                  value={form.carouselInterval}
                  onChange={e => setForm(prev => ({ ...prev, carouselInterval: Number(e.target.value) }))}
                  disabled={!form.carouselEnabled}
                />
              </div>
            </div>

            
            <div className="settings-section">
              <h3>📁 数据管理</h3>
              
              
              <div className="form-group">
                <label className="form-label">导出域名数据：</label>
                <div className="export-buttons">
                  <button
                    type="button"
                    className="btn btn-export"
                    onClick={() => handleExport('json')}
                    disabled={domains.length === 0}
                  >
                    📄 JSON
                  </button>
                  <button
                    type="button"
                    className="btn btn-export"
                    onClick={() => handleExport('csv')}
                    disabled={domains.length === 0}
                  >
                    📊 CSV
                  </button>
                  <button
                    type="button"
                    className="btn btn-export"
                    onClick={() => handleExport('txt')}
                    disabled={domains.length === 0}
                  >
                    📝 TXT
                  </button>
                </div>
                <small className="form-hint">支持导出为JSON、CSV、TXT格式</small>
              </div>

              
              <div className="form-group">
                <label className="form-label">导入域名数据：</label>
                <div className="import-section">
                  <input
                    id="file-import"
                    ref={fileInputRef}
                    type="file"
                    accept=".json,.csv,.txt"
                    onChange={handleFileImport}
                    className="file-input"
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    className="btn btn-import"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    📂 选择文件
                  </button>
                  <button
                    type="button"
                    className="btn btn-import"
                    onClick={handleCloudflareImport}
                    disabled={cloudflareLoading}
                  >
                    {cloudflareLoading ? '🔄 导入中...' : '☁️ 导入Cloudflare域名'}
                  </button>
                </div>
                <small className="form-hint">支持JSON、CSV、TXT格式，导入的数据将替换当前所有域名数据</small>
              </div>

              
              {importError && (
                <div className="import-error">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2"/>
                    <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  <span>{importError}</span>
                </div>
              )}

              {importSuccess && (
                <div className="import-success">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="22,4 12,14.01 9,11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>{importSuccess}</span>
                </div>
              )}

              {cloudflareError && (
                <div className="import-error">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2"/>
                    <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  <span>{cloudflareError}</span>
                </div>
              )}

              {cloudflareSuccess && (
                <div className="import-success">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="22,4 12,14.01 9,11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>{cloudflareSuccess}</span>
                </div>
              )}
            </div>

            
            <div className="settings-section">
              <h3>☁️ WebDAV备份/恢复</h3>
              
              <div className="form-group">
                <label className="form-label">操作：</label>
                <div className="webdav-buttons">
                  <button
                    type="button"
                    className="btn btn-backup"
                    onClick={handleWebDAVBackup}
                    disabled={webdavLoading}
                  >
                    {webdavLoading ? '🔄 备份中...' : '💾 备份到WebDAV'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-restore"
                    onClick={handleWebDAVRestore}
                    disabled={webdavLoading}
                  >
                    {webdavLoading ? '🔄 恢复中...' : '📥 从WebDAV恢复'}
                  </button>
                </div>
                <small className="form-hint">请添加 WebDAV 环境变量</small>
              </div>

              
              {webdavError && (
                <div className="webdav-error">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2"/>
                    <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  <span>{webdavError}</span>
                </div>
              )}

              {webdavSuccess && (
                <div className="webdav-success">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="22,4 12,14.01 9,11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>{webdavSuccess}</span>
                </div>
              )}
            </div>

          </div>

          <div className="modal-footer settings-modal-footer">
            <button type="button" className="btn btn-cancel-settings" onClick={onClose}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>取消</span>
            </button>
            <button type="submit" className="btn btn-save-settings">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="17,21 17,13 7,13 7,21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="7,3 7,8 15,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>保存设置</span>
            </button>
          </div>
        </form>

        
        <div 
          className="settings-section" 
          style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <h3>📋 系统日志</h3>
          
          <div className="form-group">
            <label className="form-label">日志管理：</label>
            <div className="logs-buttons">
              <button
                type="button"
                className="btn btn-logs"
                onClick={(e) => {
                  e.stopPropagation();
                  setPasswordModal(true);
                }}
              >
                📋 查看系统日志
              </button>
            </div>
            <small className="form-hint">查看操作历史日志</small>
          </div>
        </div>

        
        <PasswordModal
          isOpen={passwordModal}
          title="🔐 管理员验证"
          message="请输入管理员密码："
          onConfirm={handleLogsPasswordConfirm}
          onCancel={handleLogsPasswordCancel}
          confirmText="验证并查看"
          cancelText="取消"
        />

        
        <ConfirmModal
          isOpen={alertModal}
          title={alertType === 'success' ? '操作成功' : '操作失败'}
          message={alertMessage}
          onConfirm={handleAlertClose}
          onCancel={handleAlertClose}
          confirmText="确定"
          type={alertType === 'success' ? 'success' : 'alert'}
        />
      </div>
    </div>
  );
};

export default SettingsModal; 
