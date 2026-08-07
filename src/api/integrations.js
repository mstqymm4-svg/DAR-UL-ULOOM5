// ─────────────────────────────────────────────────────────────────────────
// Local integrations — replaces `base44.integrations.Core.*`.
//
// Only file upload survives from the old integrations set: it now uploads
// to our own Express/Multer backend instead of Base44's cloud storage.
//
// InvokeLLM (AI search) and SendEmail (cloud email) have been intentionally
// removed — this app no longer talks to any AI platform or external mail
// service. See src/components/AISearch.jsx (now a local keyword filter) and
// src/pages/Contact.jsx (now posts to /api/contact and stores messages
// locally) for their replacements.
// ─────────────────────────────────────────────────────────────────────────
import { api } from './apiClient';

// UploadFile({ file }) -> { file_url }
export async function UploadFile({ file, kind } = {}) {
  if (!file) throw new Error('No file provided');
  const formData = new FormData();
  formData.append('file', file);
  const path = kind ? `/upload/${kind}` : '/upload';
  return api.upload(path, formData);
}

export const Integrations = { UploadFile };
