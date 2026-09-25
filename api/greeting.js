import { list } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed'
    });
  }

  try {
    const id = String(req.query?.id || '').trim();

    if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid greeting id'
      });
    }

    const result = await list({
      prefix: `greetings/${id}.json`,
      limit: 1
    });

    const blob = result?.blobs?.[0];

    if (!blob?.url) {
      return res.status(404).json({
        success: false,
        error: 'لم يتم العثور على التهنئة'
      });
    }

    const response = await fetch(blob.url, {
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Blob fetch failed: ${response.status}`);
    }

    const data = await response.json();

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('GREETING ERROR:', error);

    return res.status(500).json({
      success: false,
      error: error?.message || String(error),
      name: error?.name || 'UnknownError'
    });
  }
}
