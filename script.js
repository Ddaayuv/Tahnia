/* ============================================================
   1) Fallback للنظام الجندري (في حال gender-system.js ناقص)
   ============================================================ */
(function () {
    "use strict";

    // دالة استخراج HTML المرئي حسب جنس الصفحة
    if (typeof window.getVisibleHTML !== "function") {
        window.getVisibleHTML = function (el) {
            if (!el) return "";
            if (typeof el === "string") {
                el = document.getElementById(el);
                if (!el) return "";
            }
            if (el.nodeType !== 1) return "";

            var pageGender = (document.body.getAttribute("data-page-gender") || "").trim();

            function genderMatches(node) {
                if (!node.getAttribute) return true;
                var g = node.getAttribute("data-gender");
                if (!g) return true;
                var list = g.split(/\s+/).filter(Boolean);
                return list.indexOf(pageGender) !== -1;
            }

            var ALLOWED = ["B", "I", "U", "STRONG", "EM", "SPAN", "A", "P",
                           "H1", "H2", "H3", "H4", "DIV", "SMALL"];

            function processNode(node) {
                // نص
                if (node.nodeType === 3) return node.textContent;
                if (node.nodeType !== 1) return "";

                // تجاهل العناصر المخفية
                var st = window.getComputedStyle(node);
                if (st.display === "none" || st.visibility === "hidden") return "";

                // تجاهل اللي جنسه ما يطابق
                if (!genderMatches(node)) return "";

                if (node.tagName === "BR") return "<br>";

                var isGenderWrapper = node.hasAttribute("data-gender");

                var inner = "";
                for (var i = 0; i < node.childNodes.length; i++) {
                    inner += processNode(node.childNodes[i]);
                }

                // إذا هو span الجنس — انزع الغلاف وخلي المحتوى فقط
                if (isGenderWrapper) return inner;

                // احتفظ بالوسوم المسموحة
                if (ALLOWED.indexOf(node.tagName) !== -1) {
                    var tag = node.tagName.toLowerCase();
                    var attrs = "";
                    for (var j = 0; j < node.attributes.length; j++) {
                        var a = node.attributes[j];
                        if (a.name === "data-gender") continue;
                        attrs += " " + a.name + '="' + String(a.value).replace(/"/g, "&quot;") + '"';
                    }
                    return "<" + tag + attrs + ">" + inner + "</" + tag + ">";
                }
                return inner;
            }

            var result = "";
            for (var k = 0; k < el.childNodes.length; k++) {
                result += processNode(el.childNodes[k]);
            }
            return result;
        };
    }

    // Fallback لتفعيل نظام الجنس
    if (typeof window.applyGenderSwitcher !== "function") {
        window.applyGenderSwitcher = function () {
            var pageGender = (document.body.getAttribute("data-page-gender") || "").trim();
            var all = document.querySelectorAll("[data-gender]");
            for (var i = 0; i < all.length; i++) {
                var el = all[i];
                var list = (el.getAttribute("data-gender") || "").split(/\s+/).filter(Boolean);
                if (list.indexOf(pageGender) !== -1) {
                    el.style.removeProperty("display");
                } else {
                    el.style.setProperty("display", "none", "important");
                }
            }
        };
    }
})();

/* ============================================================
   2) DisableDevtool (مع حماية من false-positive)
   ============================================================ */
(function () {
    "use strict";
    var h = window.location.hostname;
    var local =
        h === "localhost" || h === "127.0.0.1" || h === "::1" ||
        h === "[::1]" || h === "0.0.0.0" || h.endsWith(".localhost") ||
        /^10\./.test(h) || /^192\.168\./.test(h) ||
        /^172\.(1[6-9]|2[0-9]|3[01])\./.test(h) ||
        /^169\.254\./.test(h) || /^f[cd][0-9a-f]{2}:/i.test(h) ||
        /^fe80:/i.test(h);

    if (local) return;

    if (typeof window.DisableDevtool === "function") {
        try {
            window.DisableDevtool({
                disableMenu: true,
                clearLog: true,
                detectors: [1, 5, 7], // بس detectors آمنة (بدون Size اللي يسبب false-positive)
                ondevtoolopen: function () {
                    try { document.documentElement.innerHTML = ""; } catch (e) {}
                    window.location.replace("about:blank");
                }
            });
        } catch (e) {
            console.warn("DisableDevtool init failed:", e);
        }
    }
})();

/* ============================================================
   3) المتغيرات العامة والدوال المساعدة
   ============================================================ */
var loveEmojis = ["💙", "🩷", "❤️", "💜", "🧡"];
var teksSekarang = 1;
var body = document.querySelector("body");

/* ============================================================
   4) Swiper
   ============================================================ */
var swiper = new Swiper(".mySwiper", {
    allowTouchMove: false,
    pagination: {
        el: ".swiper-pagination",
        dynamicBullets: false
    },
    on: {
        slideChange: function () {
            var currentSlide = swiper.activeIndex;

            if (currentSlide === 0) {
                teksSekarang = 1;
                var helloStiker = document.querySelector("#stikerHello");
                var helloTeks = document.querySelector("#teksHello");
                var helloTombol = document.querySelector("#TombolHello");
                setTimeout(function () {
                    if (helloStiker) helloStiker.classList.add("scale1");
                    if (helloTeks) helloTeks.classList.add("scale1");
                    setTimeout(function () {
                        if (helloTombol) helloTombol.classList.add("scale1");
                    }, 300);
                }, 50);
            } else if (currentSlide === 1) {
                teksSekarang = 2;
                var stiker1 = document.querySelector("#stiker1");
                var teks1 = document.querySelector("#teks1");
                var tombolCustom = document.querySelector("#TombolCustom");
                setTimeout(function () {
                    if (stiker1) stiker1.classList.add("scale1");
                    if (teks1) teks1.classList.add("scale1");
                    setTimeout(function () {
                        if (tombolCustom) tombolCustom.classList.add("scale1");
                    }, 300);
                }, 50);
            } else if (currentSlide === 2) {
                teksSekarang = 2;
                var messageStiker = document.querySelector("#stikerMessage");
                var teksMessage = document.querySelector("#teksMessage");
                var messageTombol = document.querySelector("#TombolMessage");
                var messageContainer = teksMessage ? teksMessage.closest(".blocktext") : null;

                function getServerMessageText() {
                    var el = document.getElementById("server-message");
                    if (!el) return "";
                    var commentNode = Array.from(el.childNodes).find(function (n) {
                        return n && n.nodeType === Node.COMMENT_NODE && n.nodeValue && n.nodeValue.trim();
                    });
                    return commentNode ? commentNode.nodeValue.trim() : (el.textContent || "").trim();
                }

                var messageScrollInterval;
                function autoScrollMessage() {
                    if (messageContainer) messageContainer.scrollTop += 1;
                }

                setTimeout(function () {
                    if (messageStiker) messageStiker.classList.add("scale1");
                    if (teksMessage) teksMessage.classList.add("scale1");
                    var messageText = getServerMessageText();
                    if (teksMessage) {
                        typeArabicHTML(teksMessage, messageText, 45, function () {
                            setTimeout(function () {
                                if (messageTombol) {
                                    messageTombol.classList.add("scale1");
                                    messageTombol.classList.remove("scale0");
                                }
                                messageScrollInterval = setInterval(autoScrollMessage, 50);
                                window.messageScrollInterval = messageScrollInterval;
                            }, 300);
                        });
                    }
                }, 50);
            } else if (currentSlide === 3) {
                teksSekarang = 3;
                var teksScale = document.querySelector("#teks2");
                var stikerScale = document.querySelector("#stiker2");
                var Tombol = document.querySelector("#Tombol");
                setTimeout(function () {
                    if (teksScale) teksScale.classList.add("scale1");
                    if (stikerScale) stikerScale.classList.add("scale1");
                    if (Tombol) Tombol.style = "opacity:1;transform: scale(1);";
                }, 50);
            } else if (currentSlide === 4) {
                // قسم عيد الميلاد — نعرض القسم الأول إذا ما اتعرض بعد
                if (currentBdaySection === 0) {
                    setTimeout(function () { showBirthdaySection(1); }, 100);
                }
            } else if (currentSlide === 5) {
                teksSekarang = 4;
                var teksScale5 = document.querySelector("#teks3");
                var stikerScale5 = document.querySelector("#stiker3");
                setTimeout(function () {
                    if (teksScale5) teksScale5.classList.add("scale1");
                    if (stikerScale5) stikerScale5.classList.add("scale1");
                    setTimeout(katanimasi, 300);
                }, 50);
            }
        }
    },
    navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev"
    }
});

/* ============================================================
   5) قسم عيد الميلاد
   ============================================================ */
var currentBdaySection = 0;

function goToNextSection() {
    swiper.slideTo(2);
}

function nextBirthdaySection(sectionNum) {
    var currentSection = document.getElementById("bdaySection" + currentBdaySection);
    if (currentSection) currentSection.classList.add("sembunyi");
    showBirthdaySection(sectionNum);
}

function showBirthdaySection(num) {
    currentBdaySection = num;
    var section = document.getElementById("bdaySection" + num);
    var stiker  = document.getElementById("stikerBday" + num);
    var teks    = document.getElementById("teksBday" + num);
    var tombol  = document.getElementById("TombolBday" + num);

    if (section && stiker && teks && tombol) {
        section.classList.remove("sembunyi");
        setTimeout(function () {
            stiker.classList.add("scale1");
            teks.classList.add("scale1");
            setTimeout(function () {
                tombol.classList.add("scale1");
            }, 300);
        }, 50);
    }
}

function goToLoveSlide() {
    swiper.slideTo(5);
}

/* ============================================================
   6) typeArabicHTML - نسخة محسّنة وآمنة
   ============================================================ */
function typeArabicHTML(container, html, speed, callback) {
    speed = speed || 45;
    container.innerHTML = "";

    var tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

    var nodes = [];

    function traverse(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            nodes.push({ type: "text", text: node.textContent });
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName === "BR") {
                nodes.push({ type: "br" });
            } else {
                nodes.push({
                    type: "element",
                    tag: node.tagName.toLowerCase(),
                    attrs: Array.from(node.attributes).map(function (a) {
                        return { name: a.name, value: a.value };
                    }),
                    children: Array.from(node.childNodes)
                });
            }
        }
    }
    Array.from(tempDiv.childNodes).forEach(traverse);

    function typeNode(idx) {
        idx = idx || 0;
        if (idx >= nodes.length) {
            if (callback) callback();
            return;
        }
        var node = nodes[idx];

        if (node.type === "text") {
            var span = document.createElement("span");
            container.appendChild(span);
            var charIdx = 0;
            (function typeChar() {
                if (charIdx < node.text.length) {
                    span.textContent += node.text[charIdx++];
                    var scrollContainer = container.closest(".blocktext");
                    if (scrollContainer) scrollContainer.scrollTop = scrollContainer.scrollHeight;
                    setTimeout(typeChar, speed);
                } else {
                    typeNode(idx + 1);
                }
            })();
        } else if (node.type === "br") {
            container.appendChild(document.createElement("br"));
            typeNode(idx + 1);
        } else if (node.type === "element") {
            var el = document.createElement(node.tag);
            node.attrs.forEach(function (a) { el.setAttribute(a.name, a.value); });
            container.appendChild(el);

            if (node.children.length > 0) {
                var childHtml = node.children.map(function (c) {
                    if (c.nodeType === Node.TEXT_NODE) return c.textContent;
                    if (c.nodeType === Node.ELEMENT_NODE) return c.outerHTML;
                    return "";
                }).join("");
                typeArabicHTML(el, childHtml, speed, function () { typeNode(idx + 1); });
            } else {
                typeNode(idx + 1);
            }
        }
    }
    typeNode();
}

/* ============================================================
   7) تجهيز النصوص من العناصر (باستخدام getElementById صراحةً)
   ============================================================ */
var subteks2aEl = document.getElementById("subteks2a");
var subteks2bEl = document.getElementById("subteks2b");
var teks3El = document.getElementById("teks3");
var teksTerakhirEl = document.getElementById("teksTerakhir");
var teksTambahanEl = document.getElementById("teksTambahan");
var teksLoveEl = document.getElementById("teksLove");
var teks2El = document.getElementById("teks2");
var teksTolakEl = document.getElementById("teksTolak");
var teksTolak2El = document.getElementById("teksTolak2");
var teksTolak3El = document.getElementById("teksTolak3");

var varsubteks2a = getVisibleHTML(subteks2aEl);
var varsubteks2b = getVisibleHTML(subteks2bEl);

// ملاحظة: ما نمسح teks3 لأنه هو نفسه اللي نكتب فيه
var initeks = teks3El ? teks3El.innerHTML : "";

var initeksTerakhir = getVisibleHTML(teksTerakhirEl);
if (teksTerakhirEl) teksTerakhirEl.innerHTML = "";

var initeks3 = teksTambahanEl ? teksTambahanEl.innerHTML : "";
if (teksTambahanEl) teksTambahanEl.innerHTML = "";

var ambilRandomEmoji = loveEmojis[Math.floor(Math.random() * loveEmojis.length)];
var defTeksLove = getVisibleHTML(teksLoveEl);
if (teksLoveEl) teksLoveEl.innerHTML = "";

/* ============================================================
   8) أنيميشن الكتابة للشرائح الأخيرة
   ============================================================ */
function katanimasi() {
    if (!teks3El) return;
    var combinedText = varsubteks2a + "\n\n" + varsubteks2b;
    typeArabicHTML(teks3El, combinedText, 45, function () {
        setTimeout(function () {
            var teksScale = document.querySelector("#teks3");
            var stikerScale = document.querySelector("#stiker3");
            if (teksScale) { teksScale.classList.remove("scale1"); teksScale.classList.add("scale0"); }
            if (stikerScale) { stikerScale.classList.remove("scale1"); stikerScale.classList.add("scale0"); }
            setTimeout(function () {
                var s1 = document.getElementById("stikerAkhir1");
                var s2 = document.getElementById("stikerAkhir2");
                if (s1 && s2) s1.src = s2.src;
                teks3El.innerHTML = "";
            }, 450);
            setTimeout(function () {
                setTimeout(katanimasi2, 200);
                if (teksScale) { teksScale.classList.remove("scale0"); teksScale.classList.add("scale1"); }
                if (stikerScale) { stikerScale.classList.remove("scale0"); stikerScale.classList.add("scale1"); }
            }, 550);
        }, 1400);
    });
}

function katanimasi2() {
    if (!teks3El) return;
    typeArabicHTML(teks3El, initeksTerakhir, 45, function () {
        setTimeout(function () {
            teks3El.innerHTML += "<br><br><br><span id=\"teksLove\">" + defTeksLove + " 1% " + ambilRandomEmoji + "</span>";
            // إعادة ربط teksLoveEl للعنصر الجديد
            teksLoveEl = document.getElementById("teksLove");
            animateteksnim();
        }, 300);
    });
}

function animateteksnim() {
    var percent = 1000;
    setTimeout(function () {
        var intervalId = setInterval(function () {
            if (percent < 1000000) {
                percent += Math.floor(Math.random() * (10000 - 1000 + 1)) + 1000;
                var randomEmoji = loveEmojis[Math.floor(Math.random() * loveEmojis.length)];
                var tLove = document.getElementById("teksLove");
                if (tLove) tLove.innerHTML = "<b>" + defTeksLove + " " + percent + "% " + randomEmoji + "</b>";
            } else {
                clearInterval(intervalId);
                setInterval(falling, 200);
                percent = 1000000;
                var randomEmoji2 = loveEmojis[Math.floor(Math.random() * loveEmojis.length)];
                var tLove2 = document.getElementById("teksLove");
                if (tLove2) {
                    tLove2.innerHTML = "<b>" + defTeksLove + " <span style='color:pink'>" + percent + "%</span> " + randomEmoji2 + "</b>";
                    tLove2.style = "font-size:20px;transition:all .8s ease";
                }
                var stiker3 = document.querySelector("#stiker3");
                if (stiker3) { stiker3.classList.remove("scale1"); stiker3.classList.add("scale0"); }
                setTimeout(function () {
                    var s1 = document.getElementById("stikerAkhir1");
                    var s3 = document.getElementById("stikerAkhir3");
                    if (s1 && s3) s1.src = s3.src;
                    if (stiker3) { stiker3.classList.remove("scale0"); stiker3.classList.add("scale1"); }
                }, 400);
            }
        }, 20);
    }, 10);
}

function katanimasi3() {
    if (!teks3El) return;
    teks3El.innerHTML = "";
    var stringsArray = Array.from({ length: 10 }, function (_, i) {
        return "Iloveyouuuu " + (i + 1) + "% " + ambilRandomEmoji;
    });
    var idxString = 0;

    function typeNextString() {
        if (idxString < stringsArray.length) {
            var currentText = stringsArray[idxString];
            var idxLetter = 0;
            (function typeNextLetter() {
                if (idxLetter < currentText.length) {
                    teks3El.innerHTML += currentText[idxLetter++];
                    setTimeout(typeNextLetter, 50);
                } else {
                    teks3El.innerHTML += "<br>";
                    idxString++;
                    setTimeout(typeNextString, 100);
                }
            })();
        } else {
            teks3El.innerHTML += "<br><br><span id=\"teksLove\">" + defTeksLove + " 11% " + ambilRandomEmoji + "</span>";
            setTimeout(animateteksnim, 100);
        }
    }
    typeNextString();
}

/* ============================================================
   9) زر "هل انتِ ليلي؟" + القلب
   ============================================================ */
var sudahKlik = true;
var fungsiBerfungsi = false;

var loveInEl = document.getElementById("loveIn");
if (loveInEl) {
    loveInEl.innerHTML = '<style>.lovein svg{animation:none;stroke:#ff0000;stroke-width:1.3;fill:none;width:35px;height:35px}</style><label class="lovein"><svg class="line" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g transform="translate(2.550170, 3.550158)"><path d="M0.371729633,8.89614246 C-0.701270367,5.54614246 0.553729633,1.38114246 4.07072963,0.249142462 C5.92072963,-0.347857538 8.20372963,0.150142462 9.50072963,1.93914246 C10.7237296,0.0841424625 13.0727296,-0.343857538 14.9207296,0.249142462 C18.4367296,1.38114246 19.6987296,5.54614246 18.6267296,8.89614246 C16.9567296,14.2061425 11.1297296,16.9721425 9.50072963,16.9721425 C7.87272963,16.9721425 2.09772963,14.2681425 0.371729633,8.89614246 Z"></path><path d="M13.23843,4.013842 C14.44543,4.137842 15.20043,5.094842 15.15543,6.435842"></path></g></svg></label><p id="ket">انتِ ليلي ؟</p>';

    loveInEl.onclick = function () {
        if (sudahKlik) {
            var overlay = document.querySelector(".overlay");
            if (overlay) overlay.style.display = "none";
            var wallpaper = document.getElementById("wallpaper");
            if (wallpaper) wallpaper.style = "transform:scale(1)";

            var helloStiker = document.querySelector("#stikerHello");
            var helloTeks = document.querySelector("#teksHello");
            var helloTombol = document.querySelector("#TombolHello");

            setTimeout(function () {
                if (helloStiker) helloStiker.classList.add("scale1");
                if (helloTeks) helloTeks.classList.add("scale1");
                setTimeout(function () {
                    if (helloTombol) helloTombol.classList.add("scale1");
                    fungsiBerfungsi = true;
                }, 300);
            }, 50);
        }
    };
}

/* ============================================================
   10) قلب متساقط
   ============================================================ */
function falling() {
    var heart = document.createElement("div");
    heart.innerHTML = "<svg class='line spin' style='opacity:.5;z-index:100;stroke:#FFC2B8' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><g transform='translate(2.550170, 3.550158)'><path d='M0.371729633,8.89614246 C-0.701270367,5.54614246 0.553729633,1.38114246 4.07072963,0.249142462 C5.92072963,-0.347857538 8.20372963,0.150142462 9.50072963,1.93914246 C10.7237296,0.0841424625 13.0727296,-0.343857538 14.9207296,0.249142462 C18.4367296,1.38114246 19.6987296,5.54614246 18.6267296,8.89614246 C16.9567296,14.2061425 11.1297296,16.9721425 9.50072963,16.9721425 C7.87272963,16.9721425 2.09772963,14.2681425 0.371729633,8.89614246 Z'></path><path d='M13.23843,4.013842 C14.44543,4.137842 15.20043,5.094842 15.15543,6.435842'></path></g></svg>";
    heart.className = "heart-icon";
    heart.style.left = (Math.random() * 95) + "vw";
    heart.style.animationDuration = (Math.random() * 3) + 2 + "s";
    document.body.appendChild(heart);
}
setInterval(function () {
    var heartArr = document.querySelectorAll(".heart-icon");
    if (heartArr.length > 100) heartArr[0].remove();
}, 100);

/* ============================================================
   11) تمرير تلقائي لحاوية النصوص
   ============================================================ */
var scrollContainer = document.getElementById("scroll-container");
if (scrollContainer) {
    setInterval(function () { scrollContainer.scrollTop += 10; }, 50);
}

/* ============================================================
   12) زر "لا" (fungsibaru)
   ============================================================ */
var jumlahKlik = 0;
var jumlahSkala = 1;
var teksDefault = getVisibleHTML(teks2El);
var pesanAlert = [
    getVisibleHTML(teksTolakEl),
    getVisibleHTML(teksTolak2El),
    getVisibleHTML(teksTolak3El)
];
var stikerArray = Array.from(document.querySelectorAll('img[id^="stikerDua"]'));
var stikerDefault = document.getElementById("stikerDuaDef") ? document.getElementById("stikerDuaDef").src : "";

function fungsibaru(btn) {
    var tombol = document.getElementById(btn);
    if (!tombol) return;
    var tombolParent = tombol.parentNode;

    var tombolPosisiX = Math.floor(Math.random() * 50) + 1;
    var tombolPosisiY = Math.floor(Math.random() * 75) + 1;
    var rotasiAcak = Math.floor(Math.random() * 360);

    tombol.style.position = "relative";
    tombol.style.left = tombolPosisiX + "px";
    tombol.style.top = tombolPosisiY + "px";
    tombol.style.transform = "rotate(" + rotasiAcak + "deg)";
    tombolParent.appendChild(tombol);

    if (jumlahKlik < pesanAlert.length) {
        var teks2Element = document.querySelector("#teks2");
        var stiker2Element = document.querySelector("#stiker2");

        if (teks2Element) { teks2Element.classList.remove("scale1"); teks2Element.classList.add("scale0"); }
        if (stiker2Element) { stiker2Element.classList.remove("scale1"); stiker2Element.classList.add("scale0"); }

        setTimeout(function () {
            var stikerDuaDef = document.getElementById("stikerDuaDef");
            if (jumlahKlik === 0) {
                if (stikerDuaDef) stikerDuaDef.src = stikerDefault;
                if (teks2Element) teks2Element.innerHTML = teksDefault;
            } else {
                if (stikerDuaDef && stikerArray[jumlahKlik]) stikerDuaDef.src = stikerArray[jumlahKlik].src;
                if (teks2Element) teks2Element.innerHTML = pesanAlert[jumlahKlik - 1];
            }
            if (stiker2Element) { stiker2Element.classList.remove("scale0"); stiker2Element.classList.add("scale1"); }
            if (teks2Element) { teks2Element.classList.remove("scale0"); teks2Element.classList.add("scale1"); }
        }, 270);
    }

    var tombolBy = document.getElementById("By");
    if (tombolBy) tombolBy.style.transform = "scale(" + (1 + jumlahSkala * 0.2) + ")";

    jumlahKlik++;
    jumlahSkala++;

    if (jumlahKlik === 4) {
        swiper.slideTo(4);
        setTimeout(function () { showBirthdaySection(1); }, 100);
        jumlahKlik = 0;

        var teks2Element2 = document.querySelector("#teks2");
        var stiker2Element2 = document.querySelector("#stiker2");
        if (teks2Element2) { teks2Element2.classList.remove("scale1"); teks2Element2.classList.add("scale0"); }
        if (stiker2Element2) { stiker2Element2.classList.remove("scale1"); stiker2Element2.classList.add("scale0"); }
        setTimeout(function () {
            var stikerDuaDef = document.getElementById("stikerDuaDef");
            if (stikerDuaDef) stikerDuaDef.src = stikerDefault;
            if (teks2Element2) teks2Element2.innerHTML = teksDefault;
            if (stiker2Element2) { stiker2Element2.classList.remove("scale0"); stiker2Element2.classList.add("scale1"); }
            if (teks2Element2) { teks2Element2.classList.remove("scale0"); teks2Element2.classList.add("scale1"); }
        }, 400);
    }
}

function fungsiTerima() {
    Swal.fire({
        title: "" + teksTolakEl.innerHTML,
        imageUrl: "" + (document.getElementById("stikerTolak") ? document.getElementById("stikerTolak").src : ""),
        imageWidth: 90, imageHeight: 90, imageAlt: "by aoudumber.dev",
        confirmButtonText: "OK", showConfirmButton: false,
        allowOutsideClick: false, timer: 2200, timerProgressBar: true
    }).then(function () {
        Swal.fire({
            title: "" + teksTolak2El.innerHTML,
            imageUrl: "" + (document.getElementById("stikerTolak2") ? document.getElementById("stikerTolak2").src : ""),
            imageWidth: 90, imageHeight: 90, imageAlt: "by aoudumber.dev",
            confirmButtonText: "OK", showConfirmButton: false,
            allowOutsideClick: false, timer: 2200, timerProgressBar: true
        });
    });
}

/* ============================================================
   13) ربط الأحداث (كل زر بدالة واحدة فقط - مصلَّح)
   ============================================================ */
function bind(el, event, handler) {
    if (el) el.addEventListener(event, handler);
}

// زر التالي في شريحة الترحيب
bind(document.querySelector("#TombolHello a"), "click", function (e) {
    e.preventDefault();
    swiper.slideNext();
});

// زر "شنو هي"
bind(document.getElementById("BtnCustom"), "click", function (e) {
    e.preventDefault();
    goToNextSection();
});

// زر التالي في شريحة الرسالة
bind(document.querySelector("#TombolMessage a"), "click", function (e) {
    e.preventDefault();
    swiper.slideNext();
});

// زر "اي" (موافق)
bind(document.getElementById("By"), "click", function (e) {
    e.preventDefault();
    swiper.slideTo(4);
    setTimeout(function () { showBirthdaySection(1); }, 100);
});

// زر "لا" (مرفوض)
bind(document.getElementById("Bn"), "click", function (e) {
    e.preventDefault();
    fungsibaru("Bn");
});

// أزرار أقسام عيد الميلاد
bind(document.querySelector("#TombolBday1 a"), "click", function (e) {
    e.preventDefault(); nextBirthdaySection(2);
});
bind(document.querySelector("#TombolBday2 a"), "click", function (e) {
    e.preventDefault(); nextBirthdaySection(3);
});
bind(document.querySelector("#TombolBday3 a"), "click", function (e) {
    e.preventDefault(); nextBirthdaySection(4);
});
bind(document.querySelector("#TombolBday4 a"), "click", function (e) {
    e.preventDefault(); goToLoveSlide();
});

// تأثير hover
document.querySelectorAll("a").forEach(function (el) {
    el.addEventListener("mouseover", function () { this.style.transform = "scale(1.05)"; });
    el.addEventListener("mouseout",  function () { this.style.transform = "scale(1)"; });
});

// اختصارات لوحة المفاتيح
document.addEventListener("keydown", function (event) {
    if (event.code === "Space" || event.code === "ArrowRight") {
        swiper.slideNext();
    }
});

// النقر على خلفية الصفحة
document.addEventListener("click", function (e) {
    if (e.target.closest("a, button, .preview-banner, #popupOverlay, #popupCard, #warningTrigger, #playAudioSection, #loveIn, .lovein, #trigger, #closePopup")) return;
    if (teksSekarang !== 2 && fungsiBerfungsi === true) {
        swiper.slideNext();
    }
});

/* ============================================================
   14) تحميل الشاشة + زر تشغيل الصوت
   ============================================================ */
setTimeout(function () {
    var overlayMsg = document.querySelector(".loading-message");
    if (overlayMsg) overlayMsg.style.display = "none";
    var playAudioSection = document.getElementById("playAudioSection");
    if (playAudioSection) playAudioSection.style.display = "flex";
}, 3000);

var audioPlayed = false;
var playBtn = document.getElementById("playAudioBtn");
if (playBtn) {
    playBtn.onclick = function () {
        if (audioPlayed) return;

        var audio = document.getElementById("heartAudio");

        function continueToGift() {
            audioPlayed = true;
            var section = document.getElementById("playAudioSection");
            var love = document.getElementById("loveIn");
            if (section) section.style.display = "none";
            if (love) love.style.display = "flex";
        }

        // الصوت اختياري: حتى إذا فشل الملف أو منعه المتصفح، لا تتوقف الهدية.
        if (!audio) {
            continueToGift();
            return;
        }

        try {
            audio.currentTime = 0;
            var playPromise = audio.play();

            if (playPromise && typeof playPromise.then === "function") {
                playPromise.then(continueToGift).catch(function (err) {
                    console.warn("Audio playback failed; continuing:", err);
                    continueToGift();
                });
            } else {
                continueToGift();
            }
        } catch (err) {
            console.warn("Audio error; continuing:", err);
            continueToGift();
        }
    };
}========================================================
   1) Fallback للنظام الجندري (في حال gender-system.js ناقص)
   ============================================================ */
(function () {
    "use strict";

    // دالة استخراج HTML المرئي حسب جنس الصفحة
    if (typeof window.getVisibleHTML !== "function") {
        window.getVisibleHTML = function (el) {
            if (!el) return "";
            if (typeof el === "string") {
                el = document.getElementById(el);
                if (!el) return "";
            }
            if (el.nodeType !== 1) return "";

            var pageGender = (document.body.getAttribute("data-page-gender") || "").trim();

            function genderMatches(node) {
                if (!node.getAttribute) return true;
                var g = node.getAttribute("data-gender");
                if (!g) return true;
                var list = g.split(/\s+/).filter(Boolean);
                return list.indexOf(pageGender) !== -1;
            }

            var ALLOWED = ["B", "I", "U", "STRONG", "EM", "SPAN", "A", "P",
                           "H1", "H2", "H3", "H4", "DIV", "SMALL"];

            function processNode(node) {
                // نص
                if (node.nodeType === 3) return node.textContent;
                if (node.nodeType !== 1) return "";

                // تجاهل العناصر المخفية
                var st = window.getComputedStyle(node);
                if (st.display === "none" || st.visibility === "hidden") return "";

                // تجاهل اللي جنسه ما يطابق
                if (!genderMatches(node)) return "";

                if (node.tagName === "BR") return "<br>";

                var isGenderWrapper = node.hasAttribute("data-gender");

                var inner = "";
                for (var i = 0; i < node.childNodes.length; i++) {
                    inner += processNode(node.childNodes[i]);
                }

                // إذا هو span الجنس — انزع الغلاف وخلي المحتوى فقط
                if (isGenderWrapper) return inner;

                // احتفظ بالوسوم المسموحة
                if (ALLOWED.indexOf(node.tagName) !== -1) {
                    var tag = node.tagName.toLowerCase();
                    var attrs = "";
                    for (var j = 0; j < node.attributes.length; j++) {
                        var a = node.attributes[j];
                        if (a.name === "data-gender") continue;
                        attrs += " " + a.name + '="' + String(a.value).replace(/"/g, "&quot;") + '"';
                    }
                    return "<" + tag + attrs + ">" + inner + "</" + tag + ">";
                }
                return inner;
            }

            var result = "";
            for (var k = 0; k < el.childNodes.length; k++) {
                result += processNode(el.childNodes[k]);
            }
            return result;
        };
    }

    // Fallback لتفعيل نظام الجنس
    if (typeof window.applyGenderSwitcher !== "function") {
        window.applyGenderSwitcher = function () {
            var pageGender = (document.body.getAttribute("data-page-gender") || "").trim();
            var all = document.querySelectorAll("[data-gender]");
            for (var i = 0; i < all.length; i++) {
                var el = all[i];
                var list = (el.getAttribute("data-gender") || "").split(/\s+/).filter(Boolean);
                if (list.indexOf(pageGender) !== -1) {
                    el.style.removeProperty("display");
                } else {
                    el.style.setProperty("display", "none", "important");
                }
            }
        };
    }
})();

/* ============================================================
   2) DisableDevtool (مع حماية من false-positive)
   ============================================================ */
(function () {
    "use strict";
    var h = window.location.hostname;
    var local =
        h === "localhost" || h === "127.0.0.1" || h === "::1" ||
        h === "[::1]" || h === "0.0.0.0" || h.endsWith(".localhost") ||
        /^10\./.test(h) || /^192\.168\./.test(h) ||
        /^172\.(1[6-9]|2[0-9]|3[01])\./.test(h) ||
        /^169\.254\./.test(h) || /^f[cd][0-9a-f]{2}:/i.test(h) ||
        /^fe80:/i.test(h);

    if (local) return;

    if (typeof window.DisableDevtool === "function") {
        try {
            window.DisableDevtool({
                disableMenu: true,
                clearLog: true,
                detectors: [1, 5, 7], // بس detectors آمنة (بدون Size اللي يسبب false-positive)
                ondevtoolopen: function () {
                    try { document.documentElement.innerHTML = ""; } catch (e) {}
                    window.location.replace("about:blank");
                }
            });
        } catch (e) {
            console.warn("DisableDevtool init failed:", e);
        }
    }
})();

/* ============================================================
   3) المتغيرات العامة والدوال المساعدة
   ============================================================ */
var loveEmojis = ["💙", "🩷", "❤️", "💜", "🧡"];
var teksSekarang = 1;
var body = document.querySelector("body");

/* ============================================================
   4) Swiper
   ============================================================ */
var swiper = new Swiper(".mySwiper", {
    allowTouchMove: false,
    pagination: {
        el: ".swiper-pagination",
        dynamicBullets: false
    },
    on: {
        slideChange: function () {
            var currentSlide = swiper.activeIndex;

            if (currentSlide === 0) {
                teksSekarang = 1;
                var helloStiker = document.querySelector("#stikerHello");
                var helloTeks = document.querySelector("#teksHello");
                var helloTombol = document.querySelector("#TombolHello");
                setTimeout(function () {
                    if (helloStiker) helloStiker.classList.add("scale1");
                    if (helloTeks) helloTeks.classList.add("scale1");
                    setTimeout(function () {
                        if (helloTombol) helloTombol.classList.add("scale1");
                    }, 300);
                }, 50);
            } else if (currentSlide === 1) {
                teksSekarang = 2;
                var stiker1 = document.querySelector("#stiker1");
                var teks1 = document.querySelector("#teks1");
                var tombolCustom = document.querySelector("#TombolCustom");
                setTimeout(function () {
                    if (stiker1) stiker1.classList.add("scale1");
                    if (teks1) teks1.classList.add("scale1");
                    setTimeout(function () {
                        if (tombolCustom) tombolCustom.classList.add("scale1");
                    }, 300);
                }, 50);
            } else if (currentSlide === 2) {
                teksSekarang = 2;
                var messageStiker = document.querySelector("#stikerMessage");
                var teksMessage = document.querySelector("#teksMessage");
                var messageTombol = document.querySelector("#TombolMessage");
                var messageContainer = teksMessage ? teksMessage.closest(".blocktext") : null;

                function getServerMessageText() {
                    var el = document.getElementById("server-message");
                    if (!el) return "";
                    var commentNode = Array.from(el.childNodes).find(function (n) {
                        return n && n.nodeType === Node.COMMENT_NODE && n.nodeValue && n.nodeValue.trim();
                    });
                    return commentNode ? commentNode.nodeValue.trim() : (el.textContent || "").trim();
                }

                var messageScrollInterval;
                function autoScrollMessage() {
                    if (messageContainer) messageContainer.scrollTop += 1;
                }

                setTimeout(function () {
                    if (messageStiker) messageStiker.classList.add("scale1");
                    if (teksMessage) teksMessage.classList.add("scale1");
                    var messageText = getServerMessageText();
                    if (teksMessage) {
                        typeArabicHTML(teksMessage, messageText, 45, function () {
                            setTimeout(function () {
                                if (messageTombol) {
                                    messageTombol.classList.add("scale1");
                                    messageTombol.classList.remove("scale0");
                                }
                                messageScrollInterval = setInterval(autoScrollMessage, 50);
                                window.messageScrollInterval = messageScrollInterval;
                            }, 300);
                        });
                    }
                }, 50);
            } else if (currentSlide === 3) {
                teksSekarang = 3;
                var teksScale = document.querySelector("#teks2");
                var stikerScale = document.querySelector("#stiker2");
                var Tombol = document.querySelector("#Tombol");
                setTimeout(function () {
                    if (teksScale) teksScale.classList.add("scale1");
                    if (stikerScale) stikerScale.classList.add("scale1");
                    if (Tombol) Tombol.style = "opacity:1;transform: scale(1);";
                }, 50);
            } else if (currentSlide === 4) {
                // قسم عيد الميلاد — نعرض القسم الأول إذا ما اتعرض بعد
                if (currentBdaySection === 0) {
                    setTimeout(function () { showBirthdaySection(1); }, 100);
                }
            } else if (currentSlide === 5) {
                teksSekarang = 4;
                var teksScale5 = document.querySelector("#teks3");
                var stikerScale5 = document.querySelector("#stiker3");
                setTimeout(function () {
                    if (teksScale5) teksScale5.classList.add("scale1");
                    if (stikerScale5) stikerScale5.classList.add("scale1");
                    setTimeout(katanimasi, 300);
                }, 50);
            }
        }
    },
    navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev"
    }
});

/* ============================================================
   5) قسم عيد الميلاد
   ============================================================ */
var currentBdaySection = 0;

function goToNextSection() {
    swiper.slideTo(2);
}

function nextBirthdaySection(sectionNum) {
    var currentSection = document.getElementById("bdaySection" + currentBdaySection);
    if (currentSection) currentSection.classList.add("sembunyi");
    showBirthdaySection(sectionNum);
}

function showBirthdaySection(num) {
    currentBdaySection = num;
    var section = document.getElementById("bdaySection" + num);
    var stiker  = document.getElementById("stikerBday" + num);
    var teks    = document.getElementById("teksBday" + num);
    var tombol  = document.getElementById("TombolBday" + num);

    if (section && stiker && teks && tombol) {
        section.classList.remove("sembunyi");
        setTimeout(function () {
            stiker.classList.add("scale1");
            teks.classList.add("scale1");
            setTimeout(function () {
                tombol.classList.add("scale1");
            }, 300);
        }, 50);
    }
}

function goToLoveSlide() {
    swiper.slideTo(5);
}

/* ============================================================
   6) typeArabicHTML - نسخة محسّنة وآمنة
   ============================================================ */
function typeArabicHTML(container, html, speed, callback) {
    speed = speed || 45;
    container.innerHTML = "";

    var tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

    var nodes = [];

    function traverse(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            nodes.push({ type: "text", text: node.textContent });
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName === "BR") {
                nodes.push({ type: "br" });
            } else {
                nodes.push({
                    type: "element",
                    tag: node.tagName.toLowerCase(),
                    attrs: Array.from(node.attributes).map(function (a) {
                        return { name: a.name, value: a.value };
                    }),
                    children: Array.from(node.childNodes)
                });
            }
        }
    }
    Array.from(tempDiv.childNodes).forEach(traverse);

    function typeNode(idx) {
        idx = idx || 0;
        if (idx >= nodes.length) {
            if (callback) callback();
            return;
        }
        var node = nodes[idx];

        if (node.type === "text") {
            var span = document.createElement("span");
            container.appendChild(span);
            var charIdx = 0;
            (function typeChar() {
                if (charIdx < node.text.length) {
                    span.textContent += node.text[charIdx++];
                    var scrollContainer = container.closest(".blocktext");
                    if (scrollContainer) scrollContainer.scrollTop = scrollContainer.scrollHeight;
                    setTimeout(typeChar, speed);
                } else {
                    typeNode(idx + 1);
                }
            })();
        } else if (node.type === "br") {
            container.appendChild(document.createElement("br"));
            typeNode(idx + 1);
        } else if (node.type === "element") {
            var el = document.createElement(node.tag);
            node.attrs.forEach(function (a) { el.setAttribute(a.name, a.value); });
            container.appendChild(el);

            if (node.children.length > 0) {
                var childHtml = node.children.map(function (c) {
                    if (c.nodeType === Node.TEXT_NODE) return c.textContent;
                    if (c.nodeType === Node.ELEMENT_NODE) return c.outerHTML;
                    return "";
                }).join("");
                typeArabicHTML(el, childHtml, speed, function () { typeNode(idx + 1); });
            } else {
                typeNode(idx + 1);
            }
        }
    }
    typeNode();
}

/* ============================================================
   7) تجهيز النصوص من العناصر (باستخدام getElementById صراحةً)
   ============================================================ */
var subteks2aEl = document.getElementById("subteks2a");
var subteks2bEl = document.getElementById("subteks2b");
var teks3El = document.getElementById("teks3");
var teksTerakhirEl = document.getElementById("teksTerakhir");
var teksTambahanEl = document.getElementById("teksTambahan");
var teksLoveEl = document.getElementById("teksLove");
var teks2El = document.getElementById("teks2");
var teksTolakEl = document.getElementById("teksTolak");
var teksTolak2El = document.getElementById("teksTolak2");
var teksTolak3El = document.getElementById("teksTolak3");

var varsubteks2a = getVisibleHTML(subteks2aEl);
var varsubteks2b = getVisibleHTML(subteks2bEl);

// ملاحظة: ما نمسح teks3 لأنه هو نفسه اللي نكتب فيه
var initeks = teks3El ? teks3El.innerHTML : "";

var initeksTerakhir = getVisibleHTML(teksTerakhirEl);
if (teksTerakhirEl) teksTerakhirEl.innerHTML = "";

var initeks3 = teksTambahanEl ? teksTambahanEl.innerHTML : "";
if (teksTambahanEl) teksTambahanEl.innerHTML = "";

var ambilRandomEmoji = loveEmojis[Math.floor(Math.random() * loveEmojis.length)];
var defTeksLove = getVisibleHTML(teksLoveEl);
if (teksLoveEl) teksLoveEl.innerHTML = "";

/* ============================================================
   8) أنيميشن الكتابة للشرائح الأخيرة
   ============================================================ */
function katanimasi() {
    if (!teks3El) return;
    var combinedText = varsubteks2a + "\n\n" + varsubteks2b;
    typeArabicHTML(teks3El, combinedText, 45, function () {
        setTimeout(function () {
            var teksScale = document.querySelector("#teks3");
            var stikerScale = document.querySelector("#stiker3");
            if (teksScale) { teksScale.classList.remove("scale1"); teksScale.classList.add("scale0"); }
            if (stikerScale) { stikerScale.classList.remove("scale1"); stikerScale.classList.add("scale0"); }
            setTimeout(function () {
                var s1 = document.getElementById("stikerAkhir1");
                var s2 = document.getElementById("stikerAkhir2");
                if (s1 && s2) s1.src = s2.src;
                teks3El.innerHTML = "";
            }, 450);
            setTimeout(function () {
                setTimeout(katanimasi2, 200);
                if (teksScale) { teksScale.classList.remove("scale0"); teksScale.classList.add("scale1"); }
                if (stikerScale) { stikerScale.classList.remove("scale0"); stikerScale.classList.add("scale1"); }
            }, 550);
        }, 1400);
    });
}

function katanimasi2() {
    if (!teks3El) return;
    typeArabicHTML(teks3El, initeksTerakhir, 45, function () {
        setTimeout(function () {
            teks3El.innerHTML += "<br><br><br><span id=\"teksLove\">" + defTeksLove + " 1% " + ambilRandomEmoji + "</span>";
            // إعادة ربط teksLoveEl للعنصر الجديد
            teksLoveEl = document.getElementById("teksLove");
            animateteksnim();
        }, 300);
    });
}

function animateteksnim() {
    var percent = 1000;
    setTimeout(function () {
        var intervalId = setInterval(function () {
            if (percent < 1000000) {
                percent += Math.floor(Math.random() * (10000 - 1000 + 1)) + 1000;
                var randomEmoji = loveEmojis[Math.floor(Math.random() * loveEmojis.length)];
                var tLove = document.getElementById("teksLove");
                if (tLove) tLove.innerHTML = "<b>" + defTeksLove + " " + percent + "% " + randomEmoji + "</b>";
            } else {
                clearInterval(intervalId);
                setInterval(falling, 200);
                percent = 1000000;
                var randomEmoji2 = loveEmojis[Math.floor(Math.random() * loveEmojis.length)];
                var tLove2 = document.getElementById("teksLove");
                if (tLove2) {
                    tLove2.innerHTML = "<b>" + defTeksLove + " <span style='color:pink'>" + percent + "%</span> " + randomEmoji2 + "</b>";
                    tLove2.style = "font-size:20px;transition:all .8s ease";
                }
                var stiker3 = document.querySelector("#stiker3");
                if (stiker3) { stiker3.classList.remove("scale1"); stiker3.classList.add("scale0"); }
                setTimeout(function () {
                    var s1 = document.getElementById("stikerAkhir1");
                    var s3 = document.getElementById("stikerAkhir3");
                    if (s1 && s3) s1.src = s3.src;
                    if (stiker3) { stiker3.classList.remove("scale0"); stiker3.classList.add("scale1"); }
                }, 400);
            }
        }, 20);
    }, 10);
}

function katanimasi3() {
    if (!teks3El) return;
    teks3El.innerHTML = "";
    var stringsArray = Array.from({ length: 10 }, function (_, i) {
        return "Iloveyouuuu " + (i + 1) + "% " + ambilRandomEmoji;
    });
    var idxString = 0;

    function typeNextString() {
        if (idxString < stringsArray.length) {
            var currentText = stringsArray[idxString];
            var idxLetter = 0;
            (function typeNextLetter() {
                if (idxLetter < currentText.length) {
                    teks3El.innerHTML += currentText[idxLetter++];
                    setTimeout(typeNextLetter, 50);
                } else {
                    teks3El.innerHTML += "<br>";
                    idxString++;
                    setTimeout(typeNextString, 100);
                }
            })();
        } else {
            teks3El.innerHTML += "<br><br><span id=\"teksLove\">" + defTeksLove + " 11% " + ambilRandomEmoji + "</span>";
            setTimeout(animateteksnim, 100);
        }
    }
    typeNextString();
}

/* ============================================================
   9) زر "هل انتِ ليلي؟" + القلب
   ============================================================ */
var sudahKlik = true;
var fungsiBerfungsi = false;

var loveInEl = document.getElementById("loveIn");
if (loveInEl) {
    loveInEl.innerHTML = '<style>.lovein svg{animation:none;stroke:#ff0000;stroke-width:1.3;fill:none;width:35px;height:35px}</style><label class="lovein"><svg class="line" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g transform="translate(2.550170, 3.550158)"><path d="M0.371729633,8.89614246 C-0.701270367,5.54614246 0.553729633,1.38114246 4.07072963,0.249142462 C5.92072963,-0.347857538 8.20372963,0.150142462 9.50072963,1.93914246 C10.7237296,0.0841424625 13.0727296,-0.343857538 14.9207296,0.249142462 C18.4367296,1.38114246 19.6987296,5.54614246 18.6267296,8.89614246 C16.9567296,14.2061425 11.1297296,16.9721425 9.50072963,16.9721425 C7.87272963,16.9721425 2.09772963,14.2681425 0.371729633,8.89614246 Z"></path><path d="M13.23843,4.013842 C14.44543,4.137842 15.20043,5.094842 15.15543,6.435842"></path></g></svg></label><p id="ket">انتِ ليلي ؟</p>';

    loveInEl.onclick = function () {
        if (sudahKlik) {
            var overlay = document.querySelector(".overlay");
            if (overlay) overlay.style.display = "none";
            var wallpaper = document.getElementById("wallpaper");
            if (wallpaper) wallpaper.style = "transform:scale(1)";

            var helloStiker = document.querySelector("#stikerHello");
            var helloTeks = document.querySelector("#teksHello");
            var helloTombol = document.querySelector("#TombolHello");

            setTimeout(function () {
                if (helloStiker) helloStiker.classList.add("scale1");
                if (helloTeks) helloTeks.classList.add("scale1");
                setTimeout(function () {
                    if (helloTombol) helloTombol.classList.add("scale1");
                    fungsiBerfungsi = true;
                }, 300);
            }, 50);
        }
    };
}

/* ============================================================
   10) قلب متساقط
   ============================================================ */
function falling() {
    var heart = document.createElement("div");
    heart.innerHTML = "<svg class='line spin' style='opacity:.5;z-index:100;stroke:#FFC2B8' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><g transform='translate(2.550170, 3.550158)'><path d='M0.371729633,8.89614246 C-0.701270367,5.54614246 0.553729633,1.38114246 4.07072963,0.249142462 C5.92072963,-0.347857538 8.20372963,0.150142462 9.50072963,1.93914246 C10.7237296,0.0841424625 13.0727296,-0.343857538 14.9207296,0.249142462 C18.4367296,1.38114246 19.6987296,5.54614246 18.6267296,8.89614246 C16.9567296,14.2061425 11.1297296,16.9721425 9.50072963,16.9721425 C7.87272963,16.9721425 2.09772963,14.2681425 0.371729633,8.89614246 Z'></path><path d='M13.23843,4.013842 C14.44543,4.137842 15.20043,5.094842 15.15543,6.435842'></path></g></svg>";
    heart.className = "heart-icon";
    heart.style.left = (Math.random() * 95) + "vw";
    heart.style.animationDuration = (Math.random() * 3) + 2 + "s";
    document.body.appendChild(heart);
}
setInterval(function () {
    var heartArr = document.querySelectorAll(".heart-icon");
    if (heartArr.length > 100) heartArr[0].remove();
}, 100);

/* ============================================================
   11) تمرير تلقائي لحاوية النصوص
   ============================================================ */
var scrollContainer = document.getElementById("scroll-container");
if (scrollContainer) {
    setInterval(function () { scrollContainer.scrollTop += 10; }, 50);
}

/* ============================================================
   12) زر "لا" (fungsibaru)
   ============================================================ */
var jumlahKlik = 0;
var jumlahSkala = 1;
var teksDefault = getVisibleHTML(teks2El);
var pesanAlert = [
    getVisibleHTML(teksTolakEl),
    getVisibleHTML(teksTolak2El),
    getVisibleHTML(teksTolak3El)
];
var stikerArray = Array.from(document.querySelectorAll('img[id^="stikerDua"]'));
var stikerDefault = document.getElementById("stikerDuaDef") ? document.getElementById("stikerDuaDef").src : "";

function fungsibaru(btn) {
    var tombol = document.getElementById(btn);
    if (!tombol) return;
    var tombolParent = tombol.parentNode;

    var tombolPosisiX = Math.floor(Math.random() * 50) + 1;
    var tombolPosisiY = Math.floor(Math.random() * 75) + 1;
    var rotasiAcak = Math.floor(Math.random() * 360);

    tombol.style.position = "relative";
    tombol.style.left = tombolPosisiX + "px";
    tombol.style.top = tombolPosisiY + "px";
    tombol.style.transform = "rotate(" + rotasiAcak + "deg)";
    tombolParent.appendChild(tombol);

    if (jumlahKlik < pesanAlert.length) {
        var teks2Element = document.querySelector("#teks2");
        var stiker2Element = document.querySelector("#stiker2");

        if (teks2Element) { teks2Element.classList.remove("scale1"); teks2Element.classList.add("scale0"); }
        if (stiker2Element) { stiker2Element.classList.remove("scale1"); stiker2Element.classList.add("scale0"); }

        setTimeout(function () {
            var stikerDuaDef = document.getElementById("stikerDuaDef");
            if (jumlahKlik === 0) {
                if (stikerDuaDef) stikerDuaDef.src = stikerDefault;
                if (teks2Element) teks2Element.innerHTML = teksDefault;
            } else {
                if (stikerDuaDef && stikerArray[jumlahKlik]) stikerDuaDef.src = stikerArray[jumlahKlik].src;
                if (teks2Element) teks2Element.innerHTML = pesanAlert[jumlahKlik - 1];
            }
            if (stiker2Element) { stiker2Element.classList.remove("scale0"); stiker2Element.classList.add("scale1"); }
            if (teks2Element) { teks2Element.classList.remove("scale0"); teks2Element.classList.add("scale1"); }
        }, 270);
    }

    var tombolBy = document.getElementById("By");
    if (tombolBy) tombolBy.style.transform = "scale(" + (1 + jumlahSkala * 0.2) + ")";

    jumlahKlik++;
    jumlahSkala++;

    if (jumlahKlik === 4) {
        swiper.slideTo(4);
        setTimeout(function () { showBirthdaySection(1); }, 100);
        jumlahKlik = 0;

        var teks2Element2 = document.querySelector("#teks2");
        var stiker2Element2 = document.querySelector("#stiker2");
        if (teks2Element2) { teks2Element2.classList.remove("scale1"); teks2Element2.classList.add("scale0"); }
        if (stiker2Element2) { stiker2Element2.classList.remove("scale1"); stiker2Element2.classList.add("scale0"); }
        setTimeout(function () {
            var stikerDuaDef = document.getElementById("stikerDuaDef");
            if (stikerDuaDef) stikerDuaDef.src = stikerDefault;
            if (teks2Element2) teks2Element2.innerHTML = teksDefault;
            if (stiker2Element2) { stiker2Element2.classList.remove("scale0"); stiker2Element2.classList.add("scale1"); }
            if (teks2Element2) { teks2Element2.classList.remove("scale0"); teks2Element2.classList.add("scale1"); }
        }, 400);
    }
}

function fungsiTerima() {
    Swal.fire({
        title: "" + teksTolakEl.innerHTML,
        imageUrl: "" + (document.getElementById("stikerTolak") ? document.getElementById("stikerTolak").src : ""),
        imageWidth: 90, imageHeight: 90, imageAlt: "by aoudumber.dev",
        confirmButtonText: "OK", showConfirmButton: false,
        allowOutsideClick: false, timer: 2200, timerProgressBar: true
    }).then(function () {
        Swal.fire({
            title: "" + teksTolak2El.innerHTML,
            imageUrl: "" + (document.getElementById("stikerTolak2") ? document.getElementById("stikerTolak2").src : ""),
            imageWidth: 90, imageHeight: 90, imageAlt: "by aoudumber.dev",
            confirmButtonText: "OK", showConfirmButton: false,
            allowOutsideClick: false, timer: 2200, timerProgressBar: true
        });
    });
}

/* ============================================================
   13) ربط الأحداث (كل زر بدالة واحدة فقط - مصلَّح)
   ============================================================ */
function bind(el, event, handler) {
    if (el) el.addEventListener(event, handler);
}

// زر التالي في شريحة الترحيب
bind(document.querySelector("#TombolHello a"), "click", function (e) {
    e.preventDefault();
    swiper.slideNext();
});

// زر "شنو هي"
bind(document.getElementById("BtnCustom"), "click", function (e) {
    e.preventDefault();
    goToNextSection();
});

// زر التالي في شريحة الرسالة
bind(document.querySelector("#TombolMessage a"), "click", function (e) {
    e.preventDefault();
    swiper.slideNext();
});

// زر "اي" (موافق)
bind(document.getElementById("By"), "click", function (e) {
    e.preventDefault();
    swiper.slideTo(4);
    setTimeout(function () { showBirthdaySection(1); }, 100);
});

// زر "لا" (مرفوض)
bind(document.getElementById("Bn"), "click", function (e) {
    e.preventDefault();
    fungsibaru("Bn");
});

// أزرار أقسام عيد الميلاد
bind(document.querySelector("#TombolBday1 a"), "click", function (e) {
    e.preventDefault(); nextBirthdaySection(2);
});
bind(document.querySelector("#TombolBday2 a"), "click", function (e) {
    e.preventDefault(); nextBirthdaySection(3);
});
bind(document.querySelector("#TombolBday3 a"), "click", function (e) {
    e.preventDefault(); nextBirthdaySection(4);
});
bind(document.querySelector("#TombolBday4 a"), "click", function (e) {
    e.preventDefault(); goToLoveSlide();
});

// تأثير hover
document.querySelectorAll("a").forEach(function (el) {
    el.addEventListener("mouseover", function () { this.style.transform = "scale(1.05)"; });
    el.addEventListener("mouseout",  function () { this.style.transform = "scale(1)"; });
});

// اختصارات لوحة المفاتيح
document.addEventListener("keydown", function (event) {
    if (event.code === "Space" || event.code === "ArrowRight") {
        swiper.slideNext();
    }
});

// النقر على خلفية الصفحة
document.addEventListener("click", function (e) {
    if (e.target.closest("a, button, .preview-banner, #popupOverlay, #popupCard, #warningTrigger, #playAudioSection, #loveIn, .lovein, #trigger, #closePopup")) return;
    if (teksSekarang !== 2 && fungsiBerfungsi === true) {
        swiper.slideNext();
    }
});

/* ============================================================
   14) تحميل الشاشة + زر تشغيل الصوت
   ============================================================ */
setTimeout(function () {
    var overlayMsg = document.querySelector(".loading-message");
    if (overlayMsg) overlayMsg.style.display = "none";
    var playAudioSection = document.getElementById("playAudioSection");
    if (playAudioSection) playAudioSection.style.display = "flex";
}, 3000);

var audioPlayed = false;
var playBtn = document.getElementById("playAudioBtn");
if (playBtn) {
    playBtn.onclick = function () {
        if (audioPlayed) return;
        var audio = document.getElementById("heartAudio");
        if (!audio) return;

        audio.currentTime = 0;
        var playPromise = audio.play();
        var afterOk = function () {
            audioPlayed = true;
            var s = document.getElementById("playAudioSection");
            var l = document.getElementById("loveIn");
            if (s) s.style.display = "none";
            if (l) l.style.display = "flex";
        };
        if (playPromise !== undefined) {
            playPromise.then(afterOk).catch(function (err) {
                console.log("Audio playback failed:", err);
                setTimeout(function () {
                    audio.load();
                    audio.play().then(afterOk).catch(function () { afterOk(); });
                }, 100);
            });
        } else {
            afterOk();
        }
    };
}

/* ============================================================
   15) تفعيل نظام الجنس
   ============================================================ */
applyGenderSwitcher();

/* ============================================================
   16) Popup + Preview Banner
   ============================================================ */
var trigger = document.getElementById("warningTrigger");
var overlay2 = document.getElementById("popupOverlay");
var card2 = document.getElementById("popupCard");
var closeBtn2 = document.getElementById("closePopup");

function showPopup() {
    if (overlay2) overlay2.style.display = "flex";
    if (card2) card2.style.animation = "floatIn 0.3s ease-out forwards";
}
function hidePopup() {
    if (!card2 || !overlay2) return;
    card2.style.animation = "none";
    card2.style.transform = "scale(0.95)";
    card2.style.opacity = "0";
    setTimeout(function () { overlay2.style.display = "none"; }, 250);
}
bind(trigger, "click", showPopup);
bind(closeBtn2, "click", hidePopup);
if (overlay2) {
    overlay2.addEventListener("click", function (e) { if (e.target === overlay2) hidePopup(); });
}
document.addEventListener("keydown", function (e) { if (e.key === "Escape") hidePopup(); });

function closePreviewBanner() {
    var banner = document.getElementById("previewBanner");
    if (!banner) return;
    banner.style.animation = "slideDown 0.3s ease-in";
    setTimeout(function () { banner.style.display = "none"; }, 300);
}
document.querySelectorAll("button.preview-banner-close").forEach(function (el) {
    el.addEventListener("click", closePreviewBanner);
});

// بناء Popup المعاينة النقي
var THEME_FEATURES = {
    has_username: true,
    has_username2: false,
    has_message: true,
    has_audio: true
};

window.addEventListener("DOMContentLoaded", function () {
    if (!document.querySelector('link[href*="Lemonada"]')) {
        var fl = document.createElement("link");
        fl.rel = "stylesheet";
        fl.href = "https://fonts.googleapis.com/css2?family=Lemonada:wght@400;500;600;700&display=swap";
        document.head.appendChild(fl);
    }

    setTimeout(function () {
        if (typeof THEME_FEATURES === "undefined") return;
        var items = [];
        if (THEME_FEATURES.has_username)  items.push(["👤", "اسم المستلم (المُهدى إليه)", "اسم الشخص الذي تحب أن تُهديه هذا الرابط لتفاجئه."]);
        if (THEME_FEATURES.has_username2) items.push(["✍️", "اسم المُرسل (هُويتك)", "اسمك الذي سيظهر في الثيم لكي يعرف أن الهدية منك."]);
        if (THEME_FEATURES.has_message)   items.push(["💌", "رسالة خاصة", "رسالة من قلبك ستكون بداخل الثيم تعبر فيها عن مشاعرك."]);
        if (THEME_FEATURES.has_audio)     items.push(["🎵", "صوت خلفية", "يمكنك إرفاق أي صوت تحبه من اليوتيوب لكي يعمل كصوت خلفية ويصنع تجربة لا تنسى."]);
        if (!items.length) return;

        var font = "'Lemonada', 'Segoe UI', Arial, sans-serif";
        var si = function (el, prop, val) { el.style.setProperty(prop, val, "important"); };

        var backdrop = document.createElement("div");
        [["position","fixed"],["top","0"],["left","0"],["width","100vw"],["height","100vh"],
         ["background","rgba(0,0,0,0.45)"],["backdrop-filter","blur(12px)"],
         ["-webkit-backdrop-filter","blur(12px)"],["z-index","999990"],["margin","0"],
         ["padding","0"],["border","none"],["opacity","0"],["transition","opacity 0.4s ease"],
         ["box-sizing","border-box"]].forEach(function (p) { si(backdrop, p[0], p[1]); });
        document.documentElement.appendChild(backdrop);

        var card = document.createElement("div");
        [["position","fixed"],["top","50%"],["left","50%"],["transform","translate(-50%, -46%)"],
         ["width","min(430px, 90vw)"],["background","#ffffff"],["border-radius","22px"],
         ["padding","28px 24px"],["box-shadow","0 24px 60px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,200,215,0.4)"],
         ["z-index","999991"],["font-family",font],["direction","rtl"],["text-align","right"],
         ["box-sizing","border-box"],["color","#333"],["opacity","0"],
         ["transition","opacity 0.4s ease, transform 0.4s ease"],["overflow","hidden"]
        ].forEach(function (p) { si(card, p[0], p[1]); });

        card.innerHTML =
            '<div style="font-family:' + font + ';font-size:20px;font-weight:700;color:#d81b60;text-align:center;margin-bottom:14px;padding-bottom:12px;border-bottom:2px solid #ffe3ec;letter-spacing:0.5px;">✨ تجربة المعاينة ✨</div>' +
            '<p style="font-family:' + font + ';margin:0 0 16px;line-height:1.75;font-size:13.5px;color:#666;text-align:center;">هذا الثيم للعرض فقط — يمكنك طلب رابط خاص بك وتخصيص:</p>' +
            '<div style="display:flex;flex-direction:column;gap:10px;margin-bottom:22px;">' +
            items.map(function (it) {
                return '<div style="font-family:' + font + ';background:linear-gradient(145deg,#fff5f8,#fff);padding:12px 15px;border-radius:12px;border:1px solid #ffd6e2;">' +
                       '<strong style="font-family:' + font + ';color:#c2185b;display:block;margin-bottom:4px;font-size:13.5px;">' + it[0] + ' ' + it[1] + '</strong>' +
                       '<span style="font-family:' + font + ';color:#888;font-size:12.5px;line-height:1.5;">' + it[2] + '</span></div>';
            }).join("") +
            '</div>' +
            '<button id="zkCloseBtn" style="font-family:' + font + ';background:linear-gradient(135deg,#d81b60,#ec407a);color:#fff;border:none;width:100%;padding:14px;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;box-shadow:0 4px 18px rgba(216,27,96,0.38);display:block;box-sizing:border-box;letter-spacing:0.3px;">أكمل المعاينة 🎁</button>';

        document.documentElement.appendChild(card);

        function closePopup() {
            si(backdrop, "opacity", "0");
            si(card, "opacity", "0");
            si(card, "transform", "translate(-50%, -46%)");
            setTimeout(function () { backdrop.remove(); card.remove(); }, 400);
        }
        card.querySelector("#zkCloseBtn").addEventListener("click", closePopup);
        backdrop.addEventListener("click", closePopup);

        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                si(backdrop, "opacity", "1");
                si(card, "opacity", "1");
                si(card, "transform", "translate(-50%, -50%)");
            });
        });
    }, 15000);
});

document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closePreviewBanner();
});