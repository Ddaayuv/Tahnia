import { put } from '@vercel/blob';

export default async function handler(req, res) {
  // السماح فقط بـ POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method Not Allowed'
    });
  }

  try {
    const data = req.body;

    if (!data) {
      return res.status(400).json({
        error: 'Missing request body'
      });
    }

    // إنشاء ID فريد
    const id =
      Date.now().toString(36) +
      Math.random().toString(36).slice(2, 8);

    // حفظ بيانات التهنئة
    const blob = await put(
      `greetings/${id}.json`,
      JSON.stringify(data),
      {
        access: 'public',
        addRandomSuffix: false,
        contentType: 'application/json'
      }
    );

    return res.status(200).json({
      success: true,
      id,
      url: blob.url
    });

  } catch (error) {
    console.error('CREATE ERROR:', error);

    return res.status(500).json({
      success: false,
      error: error?.message || String(error),
      name: error?.name || 'UnknownError'
    });
  }
}
