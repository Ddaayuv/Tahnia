
(function(){
  "use strict";
  // Create simple widget behavior without touching existing scripts
  function uq(id){ return document.getElementById(id); }

  function isYouTube(url){
    return /youtube\.com|youtu\.be/.test(url);
  }
  function youtubeEmbed(url){
    var idMatch = url.match(/(?:v=|\/)([0-9A-Za-z_-]{6,11})/);
    if(!idMatch) {
      // Try youtu.be short link
      var m2 = url.match(/youtu\.be\/([0-9A-Za-z_-]{6,11})/);
      if(m2) idMatch = m2;
    }
    var id = idMatch ? idMatch[1] : null;
    if(!id) return null;
    return "https://www.youtube.com/embed/"+id+"?autoplay=1&rel=0";
  }

  function onPlayRequested(){
    var url = uq("musicUrl").value.trim();
    var name = uq("musicName").value.trim();
    var message = uq("musicMessage").value.trim();
    if(!url){
      alert("فضلاً ضع رابط الموسيقى (mp3 أو رابط يوتيوب).");
      return;
    }
    // save to localStorage (optional)
    try {
      localStorage.setItem("gift.music.url",url);
      localStorage.setItem("gift.music.name",name);
      localStorage.setItem("gift.music.msg",message);
    } catch(e){ /* ignore */ }

    // display name/message in small badge on page (non-destructive)
    var inline = document.getElementById('musicSenderInline');
    if(!inline){
      inline = document.createElement('div');
      inline.id='musicSenderInline';
      inline.className='music-sender-inline';
    }
    inline.innerHTML = "<strong>"+(name||"زائر")+"</strong><div style='font-size:13px;opacity:0.95;margin-top:6px'>"+(message||"رسالة قصيرة")+"</div>";
    // ensure it's visible inside the widget container
    var parent = document.getElementById('musicPlayerContainer'); if(parent && parent.parentNode){ parent.parentNode.appendChild(inline); }

    var container = uq("musicPlayerContainer");
    container.innerHTML = ""; // clear

    if(isYouTube(url)){
      var embed = youtubeEmbed(url);
      if(embed){
        var iframe = document.createElement("iframe");
        iframe.src = embed;
        iframe.width = "100%";
        iframe.height = 180;
        iframe.setAttribute("allow","autoplay; encrypted-media");
        iframe.setAttribute("frameborder","0");
        container.appendChild(iframe);
        // can't reliably autoplay without user gesture; user already clicked
      } else {
        container.innerText = "تعذر استخراج فيديو يوتيوب. ضع رابطاً صالحاً.";
      }
      return;
    }

    // otherwise assume direct audio file
    var audio = document.getElementById("musicAudio");
    if(!audio){
      audio = document.createElement("audio");
      audio.id = "musicAudio";
      audio.controls = true;
      audio.style.width = "100%";
      audio.preload = "auto";
      container.appendChild(audio);
    }
    audio.src = url;
    // Attempt autoplay (may be blocked if no user gesture). We called from a click, so should work.
    var p = audio.play();
    if(p !== undefined){
      p.then(function(){ /* playing */ }).catch(function(err){
        // Show a subtle hint to the user
        var hint = uq("musicWidgetHint");
        if(hint) hint.innerText = "التشغيل تلقائي قد يكون محظورًا من المتصفح — اضغط زر التشغيل في مشغل الصوت.";
      });
    }
  }

  function onToggleHide(e){
    var hide = e.target.checked;
    // hide elements with class names starting with 'preview-' (safe and reversible)
    var all = document.querySelectorAll("[class]");
    for(var i=0;i<all.length;i++){
      var el=all[i];
      var cls = el.className || "";
      if(typeof cls === "string" && cls.indexOf("preview-")!==-1){
        el.style.display = hide ? "none" : "";
      }
    }
  }

  // Restore saved values on load
  document.addEventListener("DOMContentLoaded",function(){
    try {
      var savedUrl = localStorage.getItem("gift.music.url") || "";
      var savedName = localStorage.getItem("gift.music.name") || "";
      var savedMsg = localStorage.getItem("gift.music.msg") || "";
      if(savedUrl) uq("musicUrl").value = savedUrl;
      if(savedName) uq("musicName").value = savedName;
      if(savedMsg) uq("musicMessage").value = savedMsg;
      // Optionally auto-load but do not autoplay silently
    } catch(e){}
  });

  // expose function for console if needed
  window.giftMusicWidget = {play:onPlayRequested};

})();
