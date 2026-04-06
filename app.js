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

const galleryCarousel = document.querySelector("[data-gallery-carousel]");

if (galleryCarousel) {
  const galleryViewport = galleryCarousel.querySelector("[data-gallery-viewport]");
  const galleryTrack = galleryCarousel.querySelector("[data-gallery-track]");
  const galleryPrev = galleryCarousel.querySelector("[data-gallery-prev]");
  const galleryNext = galleryCarousel.querySelector("[data-gallery-next]");
  const galleryDots = Array.from(
    galleryCarousel.querySelectorAll("[data-gallery-dot]"),
  );
  const totalSlides = galleryDots.length;
  let activeSlide = 0;
  let dragStartX = 0;
  let currentDragOffset = 0;
  let isDragging = false;
  let hasDragged = false;

  const renderGallerySlide = (withTransition = true) => {
    if (!galleryTrack) return;

    galleryTrack.style.transitionDuration = withTransition ? "500ms" : "0ms";
    galleryTrack.style.transform = `translateX(calc(-${activeSlide * 100}% + ${currentDragOffset}px))`;

    galleryDots.forEach((dot, index) => {
      const isActive = index === activeSlide;

      dot.classList.toggle("bg-brand-600", isActive);
      dot.classList.toggle("bg-brand-200", !isActive);
      dot.setAttribute("aria-current", isActive ? "true" : "false");
    });
  };

  const goToSlide = (nextSlide) => {
    activeSlide = (nextSlide + totalSlides) % totalSlides;
    currentDragOffset = 0;
    renderGallerySlide(true);
  };

  const handleDragStart = (clientX) => {
    if (!galleryViewport) return;

    isDragging = true;
    hasDragged = false;
    dragStartX = clientX;
    currentDragOffset = 0;
    galleryViewport.classList.add("cursor-grabbing");
    renderGallerySlide(false);
  };

  const handleDragMove = (clientX) => {
    if (!isDragging) return;

    currentDragOffset = clientX - dragStartX;
    hasDragged = hasDragged || Math.abs(currentDragOffset) > 6;
    renderGallerySlide(false);
  };

  const handleDragEnd = () => {
    if (!isDragging || !galleryViewport) return;

    const dragThreshold = 90;

    if (currentDragOffset <= -dragThreshold) {
      activeSlide = (activeSlide + 1) % totalSlides;
    } else if (currentDragOffset >= dragThreshold) {
      activeSlide = (activeSlide - 1 + totalSlides) % totalSlides;
    }

    isDragging = false;
    currentDragOffset = 0;
    galleryViewport.classList.remove("cursor-grabbing");
    galleryViewport.dataset.dragging = hasDragged ? "true" : "false";
    renderGallerySlide(true);

    window.setTimeout(() => {
      if (galleryViewport) {
        galleryViewport.dataset.dragging = "false";
      }
    }, 120);
  };

  galleryPrev?.addEventListener("click", () => goToSlide(activeSlide - 1));
  galleryNext?.addEventListener("click", () => goToSlide(activeSlide + 1));

  galleryDots.forEach((dot, index) => {
    dot.addEventListener("click", () => goToSlide(index));
  });

  galleryViewport?.addEventListener("mousedown", (event) => {
    handleDragStart(event.clientX);
  });

  galleryViewport?.addEventListener("mousemove", (event) => {
    handleDragMove(event.clientX);
  });

  galleryViewport?.addEventListener("mouseup", handleDragEnd);
  galleryViewport?.addEventListener("mouseleave", handleDragEnd);

  galleryViewport?.addEventListener("touchstart", (event) => {
    handleDragStart(event.touches[0].clientX);
  }, { passive: true });

  galleryViewport?.addEventListener("touchmove", (event) => {
    handleDragMove(event.touches[0].clientX);
  }, { passive: true });

  galleryViewport?.addEventListener("touchend", handleDragEnd);

  renderGallerySlide();
}

const galleryItems = Array.from(document.querySelectorAll("[data-gallery-item]"));
const galleryLightbox = document.querySelector("[data-gallery-lightbox]");

if (galleryItems.length > 0 && galleryLightbox) {
  const galleryLightboxImage = galleryLightbox.querySelector(
    "[data-gallery-lightbox-image]",
  );
  const galleryClose = galleryLightbox.querySelector("[data-gallery-close]");
  const galleryPrev = galleryLightbox.querySelector(
    "[data-gallery-lightbox-prev]",
  );
  const galleryNext = galleryLightbox.querySelector(
    "[data-gallery-lightbox-next]",
  );
  let activeGalleryIndex = 0;

  const renderLightboxImage = () => {
    const activeItem = galleryItems[activeGalleryIndex];
    const image = activeItem?.querySelector("img");

    if (!galleryLightboxImage || !image) return;

    galleryLightboxImage.src = activeItem.dataset.gallerySrc || image.src;
    galleryLightboxImage.alt = image.alt || "Preview galeri pelaku usaha";
  };

  const openLightbox = (index) => {
    activeGalleryIndex = index;
    renderLightboxImage();
    galleryLightbox.classList.remove("pointer-events-none", "opacity-0");
    galleryLightbox.classList.add("opacity-100");
    document.body.classList.add("overflow-hidden");
    galleryLightbox.setAttribute("aria-hidden", "false");
  };

  const closeLightbox = () => {
    galleryLightbox.classList.add("pointer-events-none", "opacity-0");
    galleryLightbox.classList.remove("opacity-100");
    document.body.classList.remove("overflow-hidden");
    galleryLightbox.setAttribute("aria-hidden", "true");
  };

  const showPreviousImage = () => {
    activeGalleryIndex =
      (activeGalleryIndex - 1 + galleryItems.length) % galleryItems.length;
    renderLightboxImage();
  };

  const showNextImage = () => {
    activeGalleryIndex = (activeGalleryIndex + 1) % galleryItems.length;
    renderLightboxImage();
  };

  galleryItems.forEach((item, index) => {
    item.addEventListener("click", (event) => {
      const viewport = event.currentTarget.closest("[data-gallery-viewport]");

      if (viewport?.dataset.dragging === "true") return;

      openLightbox(index);
    });
    item.addEventListener("dragstart", (event) => event.preventDefault());
  });

  galleryClose?.addEventListener("click", closeLightbox);
  galleryPrev?.addEventListener("click", showPreviousImage);
  galleryNext?.addEventListener("click", showNextImage);

  galleryLightbox.addEventListener("click", (event) => {
    if (event.target === galleryLightbox) {
      closeLightbox();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (galleryLightbox.getAttribute("aria-hidden") === "true") return;

    if (event.key === "Escape") closeLightbox();
    if (event.key === "ArrowLeft") showPreviousImage();
    if (event.key === "ArrowRight") showNextImage();
  });
}

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
