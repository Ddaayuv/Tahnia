export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const host = req.headers.host;
    const protocol = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
    const indexUrl = `${protocol}://${host}/index.html`;

    const response = await fetch(indexUrl, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to load index.html: ${response.status}`);
    }

    let html = await response.text();

    const autoplayScript = `
<script>
(function () {
  function enableGreetingAudio() {
    const audio = document.getElementById('gvAudio');
    if (!audio || !audio.src) return;

    audio.autoplay = true;
    audio.preload = 'auto';
    audio.setAttribute('autoplay', '');
    audio.setAttribute('playsinline', '');

    const tryPlay = function () {
      if (!audio.src) return;
      const promise = audio.play();
      if (promise && typeof promise.catch === 'function') {
        promise.catch(function () {});
      }
    };

    tryPlay();
    setTimeout(tryPlay, 100);
    setTimeout(tryPlay, 500);
    setTimeout(tryPlay, 1200);

    audio.addEventListener('canplay', tryPlay, { once: true });
    audio.addEventListener('loadeddata', tryPlay, { once: true });

    const startOnFirstInteraction = function () {
      tryPlay();
      window.removeEventListener('pointerdown', startOnFirstInteraction);
      window.removeEventListener('touchstart', startOnFirstInteraction);
      window.removeEventListener('click', startOnFirstInteraction);
    };

    window.addEventListener('pointerdown', startOnFirstInteraction, { once: true, passive: true });
    window.addEventListener('touchstart', startOnFirstInteraction, { once: true, passive: true });
    window.addEventListener('click', startOnFirstInteraction, { once: true });
  }

  const observer = new MutationObserver(enableGreetingAudio);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enableGreetingAudio, { once: true });
  } else {
    enableGreetingAudio();
  }
})();
</script>`;

    html = html.replace('</body>', autoplayScript + '\n</body>');

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.status(200).send(html);
  } catch (error) {
    console.error('PAGE ERROR:', error);
    res.status(500).send('تعذر تحميل الصفحة');
  }
}
