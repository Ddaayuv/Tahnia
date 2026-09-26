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
   3B) قراءة بيانات الهدية من رابط المشاركة (وضع المستلم)
   إذا كان الرابط يحتوي على name / music / msg فهذا يعني أن من
   يفتحه هو "المستلم" — نخفي نموذج الإعداد ونطبّق القيم تلقائياً.
   ============================================================ */
function getGiftParamsFromURL() {
    try {
        var params = new URLSearchParams(window.location.search);

        // الصيغة الجديدة المضغوطة: باراميتر واحد فقط "d" يقلل طول الرابط كثيراً
        // (مهم خصوصاً مع النصوص العربية الطويلة، لأن كل حرف عربي يتحول لعدة رموز %XX بالرابط العادي)
        var compressed = params.get("d");
        if (compressed && window.LZString) {
            try {
                var json = window.LZString.decompressFromEncodedURIComponent(compressed);
                var data = json ? JSON.parse(json) : null;
                if (data) {
                    return {
                        name: (data.n || "").trim(),
                        music: (data.m || "").trim(),
                        msg: (data.g || "").trim()
                    };
                }
            } catch (e) {
                console.warn("تعذر فك ضغط رابط الهدية:", e);
            }
        }

        // توافق مع الروابط القديمة (name / music / msg مباشرة)
        return {
            name: (params.get("name") || "").trim(),
            music: (params.get("music") || "").trim(),
            msg: (params.get("msg") || "").trim()
        };
    } catch (e) {
        return { name: "", music: "", msg: "" };
    }
}

var giftURLParams = getGiftParamsFromURL();
var giftIsRecipientMode = !!(giftURLParams.name || giftURLParams.music || giftURLParams.msg);

// نفعّل نظام الجنس فوراً حتى يظهر نص لغة/جنس الصفحة الصحيح فقط (بدون تكرار كل اللغات فوق بعض)
if (typeof window.applyGenderSwitcher === "function") {
    window.applyGenderSwitcher();
}

// قيم مبدئية عامة تُستخدم بباقي الشرائح (الاسم في سؤال "هل انتِ..؟" والرسالة بشريحة الرسالة)
window.giftCustomName = giftURLParams.name || "";
window.giftCustomMessage = giftURLParams.msg || "";

// إذا كان رابط جاهز (وضع المستلم) نخفي نموذج الإعداد وزر إنشاء الرابط فوراً
// ونستبدل نص التعليمات وزر التشغيل بنسخة مبسطة خاصة بالمستلم (بدون حقول الإدخال)
if (giftIsRecipientMode) {
    var giftFormElInit = document.getElementById("giftSetupForm");
    var giftLinkRowElInit = document.getElementById("giftLinkRow");
    var giftHintElInit = document.getElementById("giftHint");
    var giftKetElInit = document.getElementById("ket");
    var giftPlayBtnElInit = document.getElementById("playAudioBtn");

    if (giftFormElInit) giftFormElInit.style.display = "none";
    if (giftLinkRowElInit) giftLinkRowElInit.style.display = "none";
    if (giftHintElInit) giftHintElInit.style.display = "none";

    // نحدد لغة/صيغة النص مباشرة من جنس الصفحة الحالي (بدون التأثير على أي عناصر أخرى بالصفحة)
    var initPageGender = (document.body.getAttribute("data-page-gender") || "");
    var initIsEnglish = initPageGender.indexOf("🇺🇸") !== -1;
    var initIsFemale = initPageGender.indexOf("👧") !== -1;

    if (giftKetElInit) {
        giftKetElInit.textContent = initIsEnglish
            ? "Press the button to play the music 🎵"
            : (initIsFemale ? "اضغطي على الزر لتشغيل الموسيقى 🎵" : "اضغط على الزر لتشغيل الموسيقى 🎵");
    }
    if (giftPlayBtnElInit) {
        giftPlayBtnElInit.textContent = initIsEnglish ? "Play Music ▶️" : "تشغيل الموسيقى ▶️";
    }
}

// بناء نص سؤال "هل انتِ/انت [الاسم]؟" حسب جنس الصفحة المستهدف
function buildLoveInQuestion(name) {
    var pageGender = (document.body.getAttribute("data-page-gender") || "");
    var isFemale = pageGender.indexOf("👧") !== -1;
    if (name) {
        return (isFemale ? "انتِ " : "انت ") + name + " ؟ 🥹";
    }
    return isFemale ? "متأكدة انتِ الشخص الصحيح؟ 🥹" : "متأكد انت الشخص الصحيح؟ 🥹";
}

/* ============================================================
   4) Swiper
   ============================================================ */
/* ============================================================
   4A) Fallback آمن لـ Swiper
   إذا تعذر تحميل مكتبة Swiper من CDN لا يتوقف باقي الموقع.
   ============================================================ */
if (typeof window.Swiper !== "function") {
    window.Swiper = function (selector, options) {
        options = options || {};
        var root = document.querySelector(selector);
        var wrapper = root ? root.querySelector(".swiper-wrapper") : null;
        var slides = wrapper ? Array.from(wrapper.children) : [];
        var self = this;

        this.el = root;
        this.wrapper = wrapper;
        this.slides = slides;
        this.activeIndex = 0;

        function update() {
            if (!wrapper || !slides.length) return;

            // نفس فكرة حركة Swiper الأساسية.
            wrapper.style.display = "flex";
            wrapper.style.transition = "transform 0.45s ease";
            wrapper.style.transform = "translate3d(" + (-self.activeIndex * 100) + "%,0,0)";

            slides.forEach(function (slide, index) {
                slide.classList.toggle("swiper-slide-active", index === self.activeIndex);
            });

            if (options.pagination && options.pagination.el) {
                var pagination = document.querySelector(options.pagination.el);
                if (pagination) {
                    pagination.innerHTML = "";
                    slides.forEach(function (_, index) {
                        var bullet = document.createElement("span");
                        bullet.className = "swiper-pagination-bullet" +
                            (index === self.activeIndex ? " swiper-pagination-bullet-active" : "");
                        pagination.appendChild(bullet);
                    });
                }
            }

            if (options.on && typeof options.on.slideChange === "function") {
                options.on.slideChange.call(self);
            }
        }

        this.slideTo = function (index) {
            var max = Math.max(0, slides.length - 1);
            self.activeIndex = Math.min(Math.max(Number(index) || 0, 0), max);
            update();
        };

        this.slideNext = function () {
            self.slideTo(self.activeIndex + 1);
        };

        this.slidePrev = function () {
            self.slideTo(self.activeIndex - 1);
        };

        if (options.navigation) {
            var next = document.querySelector(options.navigation.nextEl);
            var prev = document.querySelector(options.navigation.prevEl);
            if (next) next.addEventListener("click", function () { self.slideNext(); });
            if (prev) prev.addEventListener("click", function () { self.slidePrev(); });
        }

        // شغّل حالة الشريحة الأولى بعد اكتمال إنشاء الكائن،
        // حتى لا يعتمد callback على متغير swiper قبل إسناده.
        setTimeout(function () {
            if (options.on && typeof options.on.slideChange === "function") {
                options.on.slideChange.call(self);
            }
        }, 0);
    };
}

var swiper = new Swiper(".mySwiper", {
    allowTouchMove: false,
    pagination: {
        el: ".swiper-pagination",
        dynamicBullets: false
    },
    on: {
        slideChange: function () {
            var currentSlide = (this && typeof this.activeIndex === "number")
                ? this.activeIndex
                : (swiper && typeof swiper.activeIndex === "number" ? swiper.activeIndex : 0);

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
                    if (window.giftCustomMessage) return window.giftCustomMessage;
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
    loveInEl.innerHTML = '<style>.lovein svg{animation:none;stroke:#ff0000;stroke-width:1.3;fill:none;width:35px;height:35px}</style><label class="lovein"><svg class="line" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g transform="translate(2.550170, 3.550158)"><path d="M0.371729633,8.89614246 C-0.701270367,5.54614246 0.553729633,1.38114246 4.07072963,0.249142462 C5.92072963,-0.347857538 8.20372963,0.150142462 9.50072963,1.93914246 C10.7237296,0.0841424625 13.0727296,-0.343857538 14.9207296,0.249142462 C18.4367296,1.38114246 19.6987296,5.54614246 18.6267296,8.89614246 C16.9567296,14.2061425 11.1297296,16.9721425 9.50072963,16.9721425 C7.87272963,16.9721425 2.09772963,14.2681425 0.371729633,8.89614246 Z"></path><path d="M13.23843,4.013842 C14.44543,4.137842 15.20043,5.094842 15.15543,6.435842"></path></g></svg></label><p id="ket">' + buildLoveInQuestion(window.giftCustomName) + '</p>';

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
        imageWidth: 90, imageHeight: 90, confirmButtonText: "OK", showConfirmButton: false,
        allowOutsideClick: false, timer: 2200, timerProgressBar: true
    }).then(function () {
        Swal.fire({
            title: "" + teksTolak2El.innerHTML,
            imageUrl: "" + (document.getElementById("stikerTolak2") ? document.getElementById("stikerTolak2").src : ""),
            imageWidth: 90, imageHeight: 90, confirmButtonText: "OK", showConfirmButton: false,
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

// استخراج معرف فيديو يوتيوب من أي شكل رابط (youtu.be / watch / shorts / embed)
function extractYouTubeId(url) {
    if (!url) return null;
    var patterns = [
        /youtu\.be\/([0-9A-Za-z_-]{6,15})/,
        /youtube\.com\/watch\?v=([0-9A-Za-z_-]{6,15})/,
        /youtube\.com\/embed\/([0-9A-Za-z_-]{6,15})/,
        /youtube\.com\/shorts\/([0-9A-Za-z_-]{6,15})/
    ];
    for (var i = 0; i < patterns.length; i++) {
        var m = url.match(patterns[i]);
        if (m) return m[1];
    }
    return null;
}

function isYouTubeUrl(url) {
    return /youtu\.be|youtube\.com/.test(url || "");
}

var audioPlayed = false;
var playBtn = document.getElementById("playAudioBtn");
if (playBtn) {
    playBtn.onclick = function () {
        if (audioPlayed) return;

        var recipientName, musicUrl, customMessage;

        if (giftIsRecipientMode) {
            // رابط جاهز: نأخذ القيم من الرابط مباشرة
            recipientName = giftURLParams.name;
            musicUrl = giftURLParams.music;
            customMessage = giftURLParams.msg;
        } else {
            // وضع الإنشاء: نأخذ القيم من الحقول التي كتبها المستخدم للمعاينة
            var nameInput = document.getElementById("giftRecipientName");
            var musicUrlInput = document.getElementById("giftMusicUrl");
            var messageInput = document.getElementById("giftMessage");

            recipientName = nameInput ? nameInput.value.trim() : "";
            musicUrl = musicUrlInput ? musicUrlInput.value.trim() : "";
            customMessage = messageInput ? messageInput.value.trim() : "";
        }

        // نحفظها بشكل عام حتى تستخدمها الشرائح الأخرى (سؤال "هل انتِ..؟" + الرسالة)
        window.giftCustomName = recipientName;
        window.giftCustomMessage = customMessage;

        // تحديث نص سؤال "هل انتِ/انت [الاسم]؟" بالاسم المُدخل قبل عرضه
        var loveKet = document.querySelector("#loveIn #ket");
        if (loveKet) loveKet.textContent = buildLoveInQuestion(recipientName);

        var audio = document.getElementById("heartAudio");
        var youtubeContainer = document.getElementById("youtubeAudioContainer");

        function continueToGift() {
            audioPlayed = true;
            var section = document.getElementById("playAudioSection");
            var love = document.getElementById("loveIn");
            if (section) section.style.display = "none";
            if (love) love.style.display = "flex";
        }

        // رابط يوتيوب: نشغّله بمشغل مخفي بدون التأثير على شكل الصفحة
        if (musicUrl && isYouTubeUrl(musicUrl)) {
            var videoId = extractYouTubeId(musicUrl);
            if (videoId && youtubeContainer) {
                youtubeContainer.innerHTML =
                    '<iframe width="100" height="100" allow="autoplay" ' +
                    'src="https://www.youtube.com/embed/' + videoId +
                    '?autoplay=1&playsinline=1&controls=0"></iframe>';
            } else {
                console.warn("رابط يوتيوب غير صالح، سيتم تجاهله.");
            }
            continueToGift();
            return;
        }

        // الصوت اختياري: حتى إذا فشل الملف أو منعه المتصفح، لا تتوقف الهدية.
        if (!audio) {
            continueToGift();
            return;
        }

        if (musicUrl) {
            audio.src = musicUrl;
        } else if (!audio.src) {
            // لا يوجد رابط مخصص ولا مصدر افتراضي — نكمل مباشرة بدون تشغيل
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
}

/* ============================================================
   15) إنشاء رابط الهدية القابل للمشاركة (وضع الإنشاء فقط)
   ============================================================ */
var giftGenerateBtn = document.getElementById("giftGenerateBtn");
if (giftGenerateBtn) {
    giftGenerateBtn.onclick = function () {
        var nameInput = document.getElementById("giftRecipientName");
        var musicUrlInput = document.getElementById("giftMusicUrl");
        var messageInput = document.getElementById("giftMessage");

        var name = nameInput ? nameInput.value.trim() : "";
        var music = musicUrlInput ? musicUrlInput.value.trim() : "";
        var msg = messageInput ? messageInput.value.trim() : "";

        if (!name && !music && !msg) {
            alert("اكتب على الأقل اسم الشخص أو الموسيقى أو الرسالة قبل إنشاء الرابط.");
            return;
        }

        var url = new URL(window.location.href);
        var params = new URLSearchParams();

        // نضغط البيانات بمفتاح واحد "d" بدل 3 باراميترات مفتوحة، يقلل طول الرابط كثيراً
        // (خصوصاً مع النصوص العربية اللي تتحول بالرابط العادي لعشرات الرموز %XX)
        if (window.LZString) {
            var payload = {};
            if (name) payload.n = name;
            if (music) payload.m = music;
            if (msg) payload.g = msg;
            var compressed = window.LZString.compressToEncodedURIComponent(JSON.stringify(payload));
            params.set("d", compressed);
        } else {
            // خطة بديلة إذا تعذر تحميل مكتبة الضغط من الـ CDN لأي سبب
            if (name) params.set("name", name);
            if (music) params.set("music", music);
            if (msg) params.set("msg", msg);
        }

        url.search = params.toString();

        var output = document.getElementById("giftLinkOutput");
        var result = document.getElementById("giftLinkResult");
        if (output) output.value = url.toString();
        if (result) result.style.display = "flex";
    };
}

var giftCopyBtn = document.getElementById("giftCopyBtn");
if (giftCopyBtn) {
    giftCopyBtn.onclick = function () {
        var output = document.getElementById("giftLinkOutput");
        if (!output || !output.value) return;

        function showCopied() {
            var original = giftCopyBtn.textContent;
            giftCopyBtn.textContent = "تم النسخ ✅";
            setTimeout(function () { giftCopyBtn.textContent = original; }, 1500);
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(output.value).then(showCopied).catch(function () {
                output.select();
                document.execCommand("copy");
                showCopied();
            });
        } else {
            output.select();
            document.execCommand("copy");
            showCopied();
        }
    };
}
