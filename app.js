const revealItems = document.querySelectorAll(".reveal");

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.remove("opacity-0", "translate-y-6");
      entry.target.classList.add("opacity-100", "translate-y-0");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.18 });

revealItems.forEach((item, index) => {
  item.style.transitionDelay = `${Math.min(index * 60, 260)}ms`;
  revealObserver.observe(item);
});

const counters = document.querySelectorAll(".counter");

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;

    const counter = entry.target;
    const target = Number(counter.dataset.target || 0);
    const suffix = counter.dataset.suffix || "";
    const duration = 1600;
    const startTime = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(target * eased);
      counter.textContent = value.toLocaleString("id-ID") + suffix;

      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
    counterObserver.unobserve(counter);
  });
}, { threshold: 0.5 });

counters.forEach((counter) => counterObserver.observe(counter));

const details = document.querySelectorAll(".faq-item");

details.forEach((item) => {
  item.addEventListener("toggle", () => {
    if (!item.open) return;

    details.forEach((other) => {
      if (other !== item) other.open = false;
    });
  });
});

const internalLinks = document.querySelectorAll('a[href^="#"]');

internalLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const targetId = link.getAttribute("href");

    if (!targetId || targetId === "#") return;

    const targetElement = document.querySelector(targetId);

    if (!targetElement) return;

    event.preventDefault();

    targetElement.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    window.history.pushState(null, "", targetId);
  });
});

const marqueeTracks = document.querySelectorAll("[data-marquee-id]");
const marqueeStoragePrefix = "lppom-marquee-progress:";
let marqueeSaveTimer = null;

const parseAnimationTimeToMs = (value) => {
  if (!value) return 0;

  const trimmed = value.trim();

  if (trimmed.endsWith("ms")) {
    return Number.parseFloat(trimmed);
  }

  if (trimmed.endsWith("s")) {
    return Number.parseFloat(trimmed) * 1000;
  }

  return Number.parseFloat(trimmed) || 0;
};

const getPrimaryAnimationDuration = (element) => {
  const durationValue = getComputedStyle(element).animationDuration.split(",")[0];
  return parseAnimationTimeToMs(durationValue);
};

const getCurrentAnimationTime = (element, durationMs) => {
  const animation = element
    .getAnimations()
    .find((item) => typeof item.currentTime === "number");

  if (animation && durationMs > 0) {
    return ((animation.currentTime % durationMs) + durationMs) % durationMs;
  }

  const delayValue = getComputedStyle(element).animationDelay.split(",")[0];
  const delayMs = parseAnimationTimeToMs(delayValue);

  if (durationMs > 0) {
    return ((-delayMs % durationMs) + durationMs) % durationMs;
  }

  return 0;
};

const saveMarqueeProgress = () => {
  marqueeTracks.forEach((track) => {
    const trackId = track.dataset.marqueeId;
    const durationMs = getPrimaryAnimationDuration(track);

    if (!trackId || durationMs <= 0) return;

    const currentTimeMs = getCurrentAnimationTime(track, durationMs);

    localStorage.setItem(
      `${marqueeStoragePrefix}${trackId}`,
      JSON.stringify({
        currentTimeMs,
        durationMs,
      }),
    );
  });
};

const restoreMarqueeProgress = () => {
  marqueeTracks.forEach((track) => {
    const trackId = track.dataset.marqueeId;
    const durationMs = getPrimaryAnimationDuration(track);

    if (!trackId || durationMs <= 0) return;

    const savedValue = localStorage.getItem(`${marqueeStoragePrefix}${trackId}`);

    if (!savedValue) return;

    try {
      const parsedValue = JSON.parse(savedValue);
      const savedDurationMs = Number(parsedValue.durationMs) || durationMs;
      const savedTimeMs = Number(parsedValue.currentTimeMs) || 0;
      const normalizedTimeMs =
        ((savedTimeMs % savedDurationMs) + savedDurationMs) % savedDurationMs;

      track.style.animationDelay = `-${normalizedTimeMs}ms`;
    } catch (error) {
      localStorage.removeItem(`${marqueeStoragePrefix}${trackId}`);
    }
  });
};

try {
  restoreMarqueeProgress();

  if (marqueeTracks.length > 0) {
    marqueeSaveTimer = window.setInterval(saveMarqueeProgress, 1000);
    window.addEventListener("pagehide", saveMarqueeProgress);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        saveMarqueeProgress();
      }
    });
  }
} catch (error) {
  if (marqueeSaveTimer) {
    window.clearInterval(marqueeSaveTimer);
  }
}
