import { put } from '@vercel/blob';

export const config = {
  api: {
    bodyParser: false
  }
};

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed'
    });
  }

  try {
    const folder = req.query?.folder === 'audio' ? 'audio' : 'images';
    const originalName = String(req.headers['x-file-name'] || 'file');
    const safeName = originalName
      .replace(/[^a-zA-Z0-9._-]+/g, '_')
      .slice(-120) || 'file';

    const contentType = String(
      req.headers['content-type'] || 'application/octet-stream'
    );

    const body = await readRequestBody(req);

    if (!body.length) {
      return res.status(400).json({
        success: false,
        error: 'Missing file body'
      });
    }

    const id =
      Date.now().toString(36) +
      Math.random().toString(36).slice(2, 8);

    const blob = await put(
      `${folder}/${id}-${safeName}`,
      body,
      {
        access: 'public',
        addRandomSuffix: false,
        contentType
      }
    );

    return res.status(200).json({
      success: true,
      url: blob.url
    });
  } catch (error) {
    console.error('UPLOAD ERROR:', error);

    return res.status(500).json({
      success: false,
      error: error?.message || String(error),
      name: error?.name || 'UnknownError'
    });
  }
}
