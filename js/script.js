(function () {
  "use strict";

  var PRELOAD_MS = 300;
  var COUNTER_MS = 2400;
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var audio = document.getElementById("bg-audio");
  var muteBtn = document.getElementById("mute-btn");
  var topBtn = document.getElementById("top-btn");
  var preloader = document.getElementById("preloader");
  var main = document.getElementById("main");
  var pathEl = document.getElementById("growth-path");
  var headEl = document.getElementById("growth-head");
  var yearEl = document.getElementById("growth-year");
  var progressEl = document.getElementById("growth-progress");
  var dashEl = document.getElementById("summary-dash");
  var finaleEl = document.getElementById("block-4");
  var confettiCanvas = document.getElementById("confetti-canvas");
  var shareBtn = document.getElementById("share-btn");

  var isMuted = true;
  var audioStarted = false;
  var confettiDone = false;
  var counterFrame = 0;
  var confettiFrame = 0;
  var confettiTimer = 0;
  var confettiResize = null;
  var chartBars = [];
  var chartDots = [];
  var chartPathLength = 0;

  function formatNumber(n) {
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");
  }

  function loadImage(src) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () { resolve({ src: src, ok: true }); };
      img.onerror = function () { resolve({ src: src, ok: false }); };
      img.src = src;
    });
  }

  function updateMuteIcons() {
    if (!muteBtn) return;
    muteBtn.classList.toggle("is-muted", isMuted);
    muteBtn.setAttribute("aria-pressed", isMuted ? "true" : "false");
    muteBtn.setAttribute("aria-label", isMuted ? "Включить звук" : "Выключить звук");
    muteBtn.title = isMuted ? "Звук выкл" : "Звук вкл";
  }

  /* ── Preloader ── */
  function hidePreloader() {
    if (!preloader || preloader.classList.contains("is-done")) return;
    preloader.classList.add("is-done");
    if (main) main.classList.remove("is-loading");
    setupHeroIntro();
  }

  function runPreloader() {
    var assets = [
      "assets/images/paxta-ornament3.webp"
    ];
    var timeout = new Promise(function (r) { setTimeout(r, PRELOAD_MS); });
    var minimumDisplay = new Promise(function (r) { setTimeout(r, 100); });
    var images = Promise.all(assets.map(loadImage)).then(function (results) {
      results.forEach(function (result) {
        if (!result.ok) console.warn("Не удалось загрузить ассет:", result.src);
      });
    });

    Promise.race([
      Promise.all([images, minimumDisplay]),
      timeout
    ]).then(hidePreloader);
  }

  /* ── Audio: click to start (CTA), loop, quieter ── */
  var AUDIO_VOLUME = 0.27;
  var startAmbianceBtn = document.getElementById("start-ambiance");

  function tryPlayAudio() {
    if (!audio || isMuted) return Promise.resolve(false);

    audio.loop = true;
    audio.volume = AUDIO_VOLUME;
    audio.muted = false;

    var p = audio.play();
    if (p && typeof p.then === "function") {
      return p.then(function () {
        audioStarted = true;
        return true;
      }).catch(function () {
        audioStarted = false;
        return false;
      });
    }
    audioStarted = true;
    return Promise.resolve(true);
  }

  function unlockAudioFromStart() {
    var chartSection = document.getElementById("block-2");
    if (startAmbianceBtn) {
      startAmbianceBtn.classList.add("is-done");
      startAmbianceBtn.setAttribute("aria-disabled", "true");
    }

    if (audio) {
      isMuted = false;
      audio.muted = false;
      updateMuteIcons();
      if (!audioStarted) {
        try { audio.currentTime = 0; } catch (e) { /* ignore */ }
      }
      tryPlayAudio();
    }

    if (chartSection) {
      chartSection.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    }
  }

  function setupAudio() {
    if (audio) {
      audio.volume = AUDIO_VOLUME;
      audio.loop = true;
      audio.muted = true;
      audio.preload = "none";
      audioStarted = false;
    }

    updateMuteIcons();

    // Explicit click / tap only: browsers block autoplay without a gesture.
    if (startAmbianceBtn) {
      startAmbianceBtn.addEventListener("click", function (e) {
        e.preventDefault();
        unlockAudioFromStart();
      });
    }

    if (muteBtn) {
      muteBtn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        isMuted = !isMuted;

        if (audio) {
          if (isMuted) {
            audio.muted = true;
            audio.pause();
          } else {
            audio.muted = false;
            audioStarted = false;
            audio.preload = "auto";
            try { audio.load(); } catch (err) { /* ignore */ }
            tryPlayAudio();
          }
        }
        updateMuteIcons();
      });
    }
  }

  /* ── Finale video: autoplay loop when block is in view ── */
  function setupFinaleVideo() {
    var video = document.getElementById("finale-video");
    if (!video) return;

    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.controls = false;
    video.disablePictureInPicture = true;
    video.setAttribute("controlsList", "nodownload nofullscreen noremoteplayback");

    function playVideo() {
      var p = video.play();
      if (p && typeof p.catch === "function") p.catch(function () {});
    }

    function pauseVideo() {
      try { video.pause(); } catch (e) { /* ignore */ }
    }

    if (reducedMotion) return;

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) playVideo();
          else pauseVideo();
        });
      },
      { threshold: 0.35 }
    );
    io.observe(video);
  }

  /* ── Top button ── */
  function setupTopButton() {
    if (!topBtn) return;
    var scheduled = false;

    function update() {
      var th = window.innerHeight * 0.55;
      topBtn.hidden = window.scrollY < th;
      scheduled = false;
    }

    window.addEventListener("scroll", function () {
      if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });
    topBtn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
    });
  }

  function placeArrowHead(t) {
    if (!pathEl || !headEl || typeof pathEl.getTotalLength !== "function") return;
    var pt = pathEl.getPointAtLength(Math.max(0, Math.min(1, t)) * chartPathLength);
    var pt2 = pathEl.getPointAtLength(Math.max(0, Math.min(1, t - 0.01)) * chartPathLength);
    var angle = Math.atan2(pt.y - pt2.y, pt.x - pt2.x) * (180 / Math.PI);
    headEl.setAttribute(
      "transform",
      "translate(" + pt.x + " " + pt.y + ") rotate(" + angle + ")"
    );
  }

  function setChartProgress(progress) {
    var p = Math.max(0, Math.min(1, progress));
    var years = [2018, 2020, 2022, 2024, 2026];

    if (pathEl) pathEl.style.strokeDashoffset = String(100 - p * 100);
    if (progressEl) progressEl.style.width = (p * 100).toFixed(1) + "%";
    if (headEl) {
      headEl.style.opacity = p > 0.02 ? "1" : "0";
      placeArrowHead(p);
    }

    chartBars.forEach(function (bar, index) {
      var target = parseFloat(bar.getAttribute("data-h")) || 80;
      var local = Math.max(0, Math.min(1, (p - index * 0.1) / 0.6));
      var height = target * local;
      bar.setAttribute("height", height.toFixed(1));
      bar.setAttribute("y", (320 - height).toFixed(1));
    });

    if (yearEl) {
      var segment = p * (years.length - 1);
      var startIndex = Math.floor(segment);
      var endIndex = Math.min(years.length - 1, startIndex + 1);
      var fraction = segment - startIndex;
      yearEl.textContent = String(Math.round(
        years[startIndex] + (years[endIndex] - years[startIndex]) * fraction
      ));
    }

    if (chartDots.length) {
      var activeIndex = Math.min(years.length - 1, Math.round(p * (years.length - 1)));
      chartDots.forEach(function (dot, index) {
        dot.classList.toggle("is-active", index <= activeIndex);
      });
    }
  }

  function setupChart() {
    if (!pathEl) return;
    var section = document.getElementById("block-2");
    var scheduled = false;
    var initialized = false;

    function initialize() {
      if (initialized) return;
      initialized = true;
      chartBars = Array.prototype.slice.call(document.querySelectorAll("#growth-bars .bar"));
      chartDots = Array.prototype.slice.call(document.querySelectorAll("#growth-scrub .growth__dot"));
      chartPathLength = pathEl.getTotalLength();
      pathEl.style.strokeDasharray = "100";
      setChartProgress(0);
    }

    if (reducedMotion) {
      initialize();
      setChartProgress(1);
      return;
    }

    function update() {
      initialize();
      var rect = section.getBoundingClientRect();
      var runway = Math.max(1, section.offsetHeight - window.innerHeight);
      var hold = window.innerHeight;
      var animRunway = Math.max(1, runway - hold);
      setChartProgress(Math.max(0, Math.min(1, -rect.top / animRunway)));
      scheduled = false;
    }

    function scheduleUpdate() {
      if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(update);
      }
    }

    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate, { passive: true });

    var io = new IntersectionObserver(function (entries) {
      if (entries.some(function (entry) { return entry.isIntersecting; })) {
        update();
        io.disconnect();
      }
    }, { rootMargin: "50% 0px", threshold: 0 });
    io.observe(section);
  }

  /* ── Counters: one batched animation frame ── */
  function resetCounters() {
    if (counterFrame) cancelAnimationFrame(counterFrame);
    counterFrame = 0;
    if (!dashEl) return;
    dashEl.classList.remove("is-live", "is-infinity-live");
    dashEl.querySelectorAll(".counter").forEach(function (el) {
      el.textContent = formatNumber(parseInt(el.getAttribute("data-target"), 10) || 0);
    });
  }

  function runCounters() {
    if (!dashEl) return;
    if (counterFrame) cancelAnimationFrame(counterFrame);
    var counters = Array.prototype.slice.call(dashEl.querySelectorAll(".counter"));

    if (reducedMotion) {
      counters.forEach(function (el) {
        el.textContent = formatNumber(parseInt(el.getAttribute("data-target"), 10) || 0);
      });
      dashEl.classList.add("is-live");
      return;
    }

    counters.forEach(function (el) { el.textContent = "0"; });
    dashEl.classList.add("is-live");
    var start = performance.now();

    function tick(now) {
      var t = Math.min(1, (now - start) / COUNTER_MS);
      var eased = 1 - (1 - t) * (1 - t);
      counters.forEach(function (el) {
        var target = parseInt(el.getAttribute("data-target"), 10) || 0;
        el.textContent = formatNumber(target * eased);
      });
      if (t < 1) counterFrame = requestAnimationFrame(tick);
      else counterFrame = 0;
    }

    counterFrame = requestAnimationFrame(tick);
  }

  function setupCounters() {
    if (!dashEl) return;

    var visible = false;
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var nowVisible = entry.isIntersecting && entry.intersectionRatio >= 0.25;
          if (nowVisible && !visible) {
            visible = true;
            runCounters();
          } else if (!nowVisible && visible) {
            visible = false;
          }
        });
      },
      { threshold: [0, 0.25, 0.5, 0.75] }
    );
    io.observe(dashEl);
  }

  /* ── Peers: fixed to active block; finale peer leaves 5s after end ── */
  function setupPeers() {
    var groups = {
      "block-2": [1, 2],
      "block-3": [3, 4],
      "block-4": [5]
    };
    var sectionIds = ["block-2", "block-3", "block-4"];
    var sections = sectionIds
      .map(function (id) { return document.getElementById(id); })
      .filter(Boolean);
    var footer = document.querySelector(".footer");
    var activeBlock = null;
    var finaleDismissed = false;
    var finaleEndTimer = 0;
    var scheduled = false;

    document.querySelectorAll(".peer").forEach(function (peer) {
      peer.classList.add("is-ready");
    });

    if (reducedMotion) return;

    function setActivePeers(numbers) {
      var want = {};
      numbers.forEach(function (number) {
        want[number] = true;
      });

      document.querySelectorAll(".peer").forEach(function (peer) {
        var id = parseInt(peer.getAttribute("data-peer"), 10);
        peer.classList.toggle("is-active", !!want[id]);
      });

      if (main) main.classList.toggle("has-peer-active", numbers.length > 0);
    }

    function clearFinaleTimer() {
      if (finaleEndTimer) {
        clearTimeout(finaleEndTimer);
        finaleEndTimer = 0;
      }
    }

    function getActiveBlock() {
      var focusY = window.innerHeight * 0.42;
      var bestId = null;
      var bestScore = -1;

      sections.forEach(function (section) {
        var rect = section.getBoundingClientRect();
        var visibleTop = Math.max(0, rect.top);
        var visibleBottom = Math.min(window.innerHeight, rect.bottom);
        var visible = Math.max(0, visibleBottom - visibleTop);
        if (visible < window.innerHeight * 0.18) return;

        var containsFocus = rect.top <= focusY && rect.bottom >= focusY;
        var score = visible + (containsFocus ? window.innerHeight : 0);
        if (score > bestScore) {
          bestScore = score;
          bestId = section.id;
        }
      });

      return bestId;
    }

    function isFinaleAtEnd() {
      var finale = document.getElementById("block-4");
      if (!finale) return false;
      if (footer) {
        var footerRect = footer.getBoundingClientRect();
        if (footerRect.top < window.innerHeight * 0.92) return true;
      }
      var rect = finale.getBoundingClientRect();
      return rect.bottom <= window.innerHeight + 12;
    }

    function showPeersForBlock(blockId) {
      if (!blockId) {
        setActivePeers([]);
        return;
      }
      if (blockId === "block-4" && finaleDismissed) {
        setActivePeers([]);
        return;
      }
      setActivePeers(groups[blockId] || []);
    }

    function update() {
      scheduled = false;
      var blockId = getActiveBlock();

      if (blockId !== activeBlock) {
        if (activeBlock === "block-4" && blockId !== "block-4") {
          finaleDismissed = false;
          clearFinaleTimer();
        }
        activeBlock = blockId;
        showPeersForBlock(blockId);
      }

      if (blockId === "block-4" && !finaleDismissed) {
        if (isFinaleAtEnd()) {
          if (!finaleEndTimer) {
            finaleEndTimer = setTimeout(function () {
              finaleEndTimer = 0;
              if (activeBlock === "block-4") {
                finaleDismissed = true;
                setActivePeers([]);
              }
            }, 5000);
          }
        } else {
          clearFinaleTimer();
        }
      }
    }

    function scheduleUpdate() {
      if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(update);
      }
    }

    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate, { passive: true });
    update();
  }

  function launchConfetti() {
    if (reducedMotion || confettiDone || !confettiCanvas || !finaleEl) return;
    stopConfetti();
    confettiDone = true;

    var ctx = confettiCanvas.getContext("2d");
    var particles = [];
    var start = performance.now();
    var dur = 4800;
    var colors = ["#142444", "#ebdbbb", "#e3d3b3", "#293855", "#ffffff", "#697488"];
    var width = 0;
    var height = 0;

    function resize() {
      var ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = finaleEl.clientWidth;
      height = finaleEl.clientHeight;
      confettiCanvas.width = Math.round(width * ratio);
      confettiCanvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
    resize();
    confettiResize = resize;
    window.addEventListener("resize", confettiResize, { passive: true });

    function spawn(side, n) {
      for (var i = 0; i < n; i++) {
        var left = side === "left";
        particles.push({
          x: left ? -8 : width + 8,
          y: height * (0.12 + Math.random() * 0.5),
          vx: (left ? 1 : -1) * (5 + Math.random() * 9),
          vy: -(2 + Math.random() * 5),
          g: 0.11 + Math.random() * 0.09,
          size: 3 + Math.random() * 6,
          rot: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 0.22,
          color: colors[(Math.random() * colors.length) | 0],
          life: 1,
          side: side
        });
      }
    }

    spawn("left", 60);
    spawn("right", 60);
    confettiTimer = setTimeout(function () {
      spawn("left", 28);
      spawn("right", 28);
    }, 600);

    function frame(now) {
      var safeL = width * 0.28;
      var safeR = width * 0.72;
      ctx.clearRect(0, 0, width, height);

      for (var i = particles.length - 1; i >= 0; i--) {
        var p = particles[i];
        p.vy += p.g;
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.99;
        p.rot += p.vr;
        p.life -= 0.0035;

        if (p.x > safeL && p.x < safeR) {
          p.x = p.side === "left" ? safeL - 4 : safeR + 4;
          p.vx *= 0.4;
        }

        if (p.y > height + 40 || p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      }

      if (now - start < dur && particles.length) {
        confettiFrame = requestAnimationFrame(frame);
      } else {
        ctx.clearRect(0, 0, width, height);
        if (confettiResize) {
          window.removeEventListener("resize", confettiResize);
          confettiResize = null;
        }
        confettiFrame = 0;
      }
    }

    confettiFrame = requestAnimationFrame(frame);
  }

  function stopConfetti() {
    if (confettiFrame) cancelAnimationFrame(confettiFrame);
    if (confettiTimer) clearTimeout(confettiTimer);
    if (confettiResize) window.removeEventListener("resize", confettiResize);
    confettiFrame = 0;
    confettiTimer = 0;
    confettiResize = null;
    if (confettiCanvas) {
      var ctx = confettiCanvas.getContext("2d");
      ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }
  }

  function setupConfetti() {
    if (reducedMotion || !finaleEl) return;
    var visible = false;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !visible) {
          visible = true;
          confettiDone = false;
          launchConfetti();
        } else if (!entry.isIntersecting && visible) {
          visible = false;
          stopConfetti();
        }
      });
    }, { threshold: 0.35 });
    io.observe(finaleEl);
  }

  function setupHeroIntro() {
    if (reducedMotion) return;
    document.querySelectorAll(".hero__content > *").forEach(function (element, index) {
      element.animate(
        [
          { transform: "translateY(28px)", opacity: 0 },
          { transform: "translateY(0)", opacity: 1 }
        ],
        {
          duration: 850,
          delay: 100 + index * 120,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "both"
        }
      );
    });
  }

  function setupShare() {
    if (!shareBtn) return;

    if (!navigator.share) {
      shareBtn.hidden = true;
      return;
    }

    shareBtn.addEventListener("click", function () {
      navigator.share({
        title: "Выпуск Авито 2026 — Татьяна Шатунова",
        text: "Спасибо за сводные, Таня! С любовью, спецкачи.",
        url: window.location.href
      }).catch(function () {});
    });
  }

  function init() {
    setupAudio();
    setupTopButton();
    runPreloader();
    setupChart();
    setupCounters();
    setupPeers();
    setupConfetti();
    setupFinaleVideo();
    setupShare();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
