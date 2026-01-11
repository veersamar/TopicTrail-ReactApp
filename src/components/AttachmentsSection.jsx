import React from 'react';
import { api } from '../services/api';

const AttachmentsSection = ({ attachments }) => {
    if (!attachments || attachments.length === 0) return null;

    // Helper to get file icon
    const getFileIcon = (fileName) => {
        const ext = fileName ? fileName.split('.').pop().toLowerCase() : '';
        const icons = {
            pdf: 'bi-file-earmark-pdf text-danger',
            doc: 'bi-file-earmark-word text-primary',
            docx: 'bi-file-earmark-word text-primary',
            xls: 'bi-file-earmark-excel text-success',
            xlsx: 'bi-file-earmark-excel text-success',
            png: 'bi-file-earmark-image text-info',
            jpg: 'bi-file-earmark-image text-info',
            jpeg: 'bi-file-earmark-image text-info',
            gif: 'bi-file-earmark-image text-info',
        };
        return icons[ext] || 'bi-file-earmark text-secondary';
    };

    // Helper to format file size
    const formatFileSize = (bytes) => {
        if (!bytes || bytes === 0) return '';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="card shadow-sm border-0 mb-4 mt-4">
            <div className="card-body p-4">
                <h5 className="mb-3 fw-bold border-bottom pb-2">
                    <i className="bi bi-paperclip me-2"></i>
                    Attachments ({attachments.length})
                </h5>
                <div className="list-group list-group-flush">
                    {attachments.map((att, index) => {
                        const downloadUrl = att.downloadUrl || att.DownloadUrl || (att.id ? api.getAttachmentDownloadUrl(att.id) : '#');
                        const fileName = att.fileName || att.FileName || att.name || 'document';
                        const fileSize = att.fileSize || att.FileSize;

                        return (
                            <div key={att.id || index} className="list-group-item px-0 py-3 d-flex justify-content-between align-items-center">
                                <div className="d-flex align-items-center">
                                    <i className={`bi ${getFileIcon(fileName)} fs-3 me-3`}></i>
                                    <div>
                                        <div className="fw-medium">{fileName}</div>
                                        {fileSize && <div className="text-muted small">{formatFileSize(fileSize)}</div>}
                                    </div>
                                </div>
                                <a
                                    href={downloadUrl}
                                    className="btn btn-outline-primary btn-sm rounded-pill px-3"
                                    download
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <i className="bi bi-download me-1"></i> Download
                                </a>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default AttachmentsSection;
