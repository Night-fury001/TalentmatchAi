const fs = require('fs/promises');
const path = require('path');

const MAX_EXTRACTED_CHARS = 50000;

/**
 * Deletes a file on disk if it exists. Path is expected relative to the
 * server root (e.g. "/uploads/resumes/abc.pdf" as stored on the model),
 * so we resolve it against the server directory. Never throws — a missing
 * file (already deleted, moved, etc.) is not a failure condition here.
 */
async function deleteFileIfExists(relativeUrl) {
  if (!relativeUrl) return;
  try {
    const absolutePath = path.join(__dirname, '..', relativeUrl.replace(/^\//, ''));
    await fs.unlink(absolutePath);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      // eslint-disable-next-line no-console
      console.error('[fileUtils] Failed to delete file:', relativeUrl, err.message);
    }
  }
}

/**
 * Extracts plain text from an uploaded resume for downstream AI matching
 * (Phase 6). Supports PDF and DOCX. Legacy .doc files and any extraction
 * failure degrade gracefully to `null` rather than blocking the upload —
 * the file itself is still stored and usable by the candidate/recruiter.
 */
async function extractResumeText(absolutePath, mimetype) {
  try {
    if (mimetype === 'application/pdf') {
      const pdfParse = require('pdf-parse');
      const buffer = await fs.readFile(absolutePath);
      const data = await pdfParse(buffer);
      return (data.text || '').trim().slice(0, MAX_EXTRACTED_CHARS) || null;
    }

    if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ path: absolutePath });
      return (result.value || '').trim().slice(0, MAX_EXTRACTED_CHARS) || null;
    }

    // Legacy .doc (application/msword) has no reliable pure-JS parser —
    // the resume is still stored and viewable, just not text-indexed.
    return null;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[fileUtils] Resume text extraction failed:', err.message);
    return null;
  }
}

module.exports = { deleteFileIfExists, extractResumeText };
