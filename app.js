/* ============================================================
   EATO'S — app
   Hash router with a signature "shutter" page transition (vertical
   bars sweep closed, content swaps, bars sweep open) between every
   page. Six routes: Home, Menu, Locations, Story, Book, Contact.
   ============================================================ */
(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const app = document.getElementById("app");
  const overlay = document.getElementById("page-transition");
  const bars = overlay.querySelectorAll(".shutter-bars span");
  const yearEl = document.getElementById("year");
  if(yearEl) yearEl.textContent = new Date().getFullYear();

  const WHATSAPP_NUMBER = "01951467502"; // TODO: replace with your real number
  const fmt = (n) => "\u09f3" + n.toLocaleString("en-US");

  /* ---------------------------------------------------------
     Sound toggle — governs both the voice lines and the crunch
     transition effect, persisted, off by default
  --------------------------------------------------------- */
  const SOUND_KEY = "eatos-sound";
  const soundToggle = document.getElementById("sound-toggle");
  function setSound(on){
    if(window.EatosVoice) window.EatosVoice.setEnabled(on);
    if(window.EatosAudio) window.EatosAudio.setEnabled(on);
    if(soundToggle){
      soundToggle.setAttribute("aria-pressed", String(on));
      soundToggle.querySelector(".sound-icon").textContent = on ? "\u266a" : "\u25d4";
    }
    localStorage.setItem(SOUND_KEY, on ? "1" : "0");
  }
  soundToggle?.addEventListener("click", () => {
    setSound(!(window.EatosVoice && window.EatosVoice.isEnabled()));
  });
  setSound(localStorage.getItem(SOUND_KEY) === "1");

  // Browsers block audio/speech before the visitor interacts with the
  // page at all — so the welcome line fires on that first tap/click,
  // not instantly on load, if sound is already turned on.
  function tryWelcome(){
    if(window.EatosVoice && window.EatosVoice.isEnabled()) window.EatosVoice.sayWelcome();
  }
  window.addEventListener("pointerdown", tryWelcome, { once: true });
  tryWelcome();

  /* ---------------------------------------------------------
     Shared fragments
  --------------------------------------------------------- */
  function marqueeHTML(words, alt){
    const line = words.map(w => `<span>${w}</span>`).join("");
    return `
      <div class="marquee${alt ? " alt" : ""}"><div class="marquee-track">${line}${line}</div></div>`;
  }

  function sectionHead(num, title, note){
    return `
      <div class="section-head reveal">
        <span class="section-num">${num}</span>
        <h2>${title}</h2>
        ${note ? `<p class="section-note">${note}</p>` : ""}
      </div>`;
  }

  /* ---------------------------------------------------------
     VIEWS
  --------------------------------------------------------- */
  function viewHome(){
    return `
      <section class="hero">
        <canvas id="hero-ambient" aria-hidden="true"></canvas>
        <p class="eyebrow reveal">Independent food chain &middot; Dhaka / everywhere</p>
        <h1 class="mega-title reveal">FEED THE<br>IMAGINATION.</h1>
        <p class="hero-line reveal">EATO'S is a food chain built around appetite, atmosphere and unexpected detail.</p>
        <a href="#/menu" data-route="/menu" class="scroll-cue">
          <span>See the menu</span>
          <svg viewBox="0 0 24 24" width="15" height="15"><path d="M12 4v14M6 13l6 6 6-6" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>
        </a>
      </section>

      ${marqueeHTML(["Eat slowly. Look closer.", "EATO'S"])}

      <section class="philosophy">
        ${sectionHead("01 / Philosophy", "Food doesn't have to shout to be remembered. <em>We build moments around texture, heat, crunch, silence and the first bite.</em>")}
        <div class="tex-grid">
          <div class="tex-card reveal"><span class="tex-num">01</span><span class="tex-label">Foil / heat</span></div>
          <div class="tex-card reveal"><span class="tex-num">02</span><span class="tex-label">Gloss / crunch</span></div>
          <div class="tex-card reveal"><span class="tex-num">03</span><span class="tex-label">Smoke / steel</span></div>
          <div class="tex-card reveal"><span class="tex-num">04</span><span class="tex-label">Cream / shadow</span></div>
        </div>
      </section>

      <section class="picks">
        ${sectionHead("02 / Today's Picks", "Four dishes worth the trip &mdash; see the full menu for everything else.")}
        <div class="picks-grid" id="picks-grid"></div>
        <a href="#/menu" data-route="/menu" class="btn-ghost picks-link">See the Full Menu</a>
      </section>

      ${marqueeHTML(["Burgers", "&middot;", "Steaks", "&middot;", "Grills", "&middot;", "Mac & Cheese", "&middot;"], true)}

      <section class="manifesto">
        <h2 class="manifesto-line reveal">We cook first.<br>We brand second.</h2>
        <p class="manifesto-body reveal">No heat lamps. No pre-fried batches under glass. Every location shares one kitchen philosophy &mdash; small batches, real fire, and a cook who tastes before it goes out.</p>
      </section>

      <section class="cta-banner">
        <h2 class="reveal">Come hungry.<br>Leave with a story.</h2>
        <div class="book-actions reveal">
          <a href="#/book" data-route="/book" class="btn-primary">Book a Table</a>
          <a href="#/locations" data-route="/locations" class="btn-ghost">Find a Location</a>
        </div>
      </section>`;
  }

  function viewMenu(){
    return `
      <section class="menu-section page-top">
        ${sectionHead("03 / The Menu", "Made when you order it.<br><em>Not before.</em>")}
        <div class="menu-tabs" id="menu-tabs" role="tablist"></div>
        <div class="menu-list" id="menu-list"></div>
        <p class="menu-note reveal">Prices shown in BDT, Dhaka dine-in. Subject to change &mdash; ask staff for the day's specials.</p>
        <div class="book-actions reveal" style="margin-top:60px;">
          <a href="#/book" data-route="/book" class="btn-primary">Reserve a Table</a>
        </div>
      </section>`;
  }

  function viewLocations(){
    const rows = window.EATOS_LOCATIONS.map(loc => `
      <div class="location-card reveal">
        <div class="location-top">
          <h3>${loc.area}</h3>
          <span class="location-status ${loc.status === "Open now" ? "open" : "soon"}">${loc.status}</span>
        </div>
        <p class="location-city">${loc.city}</p>
        <div class="location-meta">
          <span>${loc.hours}</span>
          <span>${loc.phone}</span>
        </div>
        <a href="https://www.google.com/maps/search/EATO'S+${encodeURIComponent(loc.area)}+Dhaka" target="_blank" rel="noopener" class="location-link">Get Directions &#8599;</a>
      </div>`).join("");

    return `
      <section class="locations-section page-top">
        ${sectionHead("04 / Locations", "Four branches across Dhaka &mdash; more on the way.")}
        <div class="locations-grid">${rows}</div>
        <p class="expansion-note reveal">Expanding to Chittagong &amp; Sylhet &mdash; opening 2026.</p>
      </section>`;
  }

  function viewStory(){
    const teamGroups = ["Founders", "The Kitchen"];
    const teamHTML = teamGroups.map(group => `
      <div class="team-col reveal">
        <span class="team-col-label">${group}</span>
        ${window.EATOS_TEAM.filter(t => t.group === group).map(t => `<p>${t.name} <span class="team-role">&mdash; ${t.role}</span></p>`).join("")}
      </div>`).join("");

    return `
      <section class="manifesto page-top">
        <h2 class="manifesto-line reveal">We cook first.<br>We brand second.</h2>
        <p class="manifesto-body reveal">No heat lamps. No pre-fried batches sitting under glass. No menu items that exist only on the app. Every location shares one kitchen philosophy &mdash; small batches, real fire, and a cook who tastes before it goes out. If it wouldn't pass in our first kitchen, it doesn't pass anywhere.</p>
      </section>

      <section class="index-section subsection">
        ${sectionHead("05 / The Index", "Selected EATO'S worlds")}
        <div class="index-list">
          <a href="#/book" data-route="/book" class="index-row reveal">
            <span class="index-title">After Dark</span>
            <span class="index-desc">Late-night plates, hard shadows and a menu designed for the hour after midnight.</span>
            <span class="index-arrow">Explore &#8599;</span>
          </a>
          <a href="#/book" data-route="/book" class="index-row reveal">
            <span class="index-title">Crunch Theory</span>
            <span class="index-desc">A tactile study of texture &mdash; crisp edges, soft centres and unapologetic sound.</span>
            <span class="index-arrow">Explore &#8599;</span>
          </a>
          <a href="#/book" data-route="/book" class="index-row reveal">
            <span class="index-title">Table 00</span>
            <span class="index-desc">An intimate dining experiment where the table becomes part of the dish.</span>
            <span class="index-arrow">Explore &#8599;</span>
          </a>
          <a href="#/book" data-route="/book" class="index-row reveal">
            <span class="index-title">The Red Hour</span>
            <span class="index-desc">A seasonal ritual built around fire, smoke and the last light of day.</span>
            <span class="index-arrow">Explore &#8599;</span>
          </a>
        </div>
      </section>

      <section class="chant" aria-hidden="true">
        <div class="chant-track">
          <span>no boring bites.</span><span>&middot;</span>
          <span>no boring bites.</span><span>&middot;</span>
          <span>no boring bites.</span><span>&middot;</span>
          <span>no boring bites.</span><span>&middot;</span>
        </div>
      </section>

      <section class="team-section subsection">
        ${sectionHead("06 / The People", "EATO'S without people is just a kitchen.")}
        <div class="team-grid">${teamHTML}</div>
      </section>`;
  }

  function viewBook(){
    const locationOptions = window.EATOS_LOCATIONS.map(l => `<option value="${l.area}">${l.area}</option>`).join("");
    return `
      <section class="book-page page-top">
        ${sectionHead("07 / Reserve", "Come hungry.<br><em>Leave with a story.</em>", "Fill this in and we'll confirm on WhatsApp &mdash; no account needed.")}
        <form id="reserve-form" class="reserve-form reveal">
          <label>Full name
            <input type="text" name="name" required autocomplete="name">
          </label>
          <label>Phone number
            <input type="tel" name="phone" required autocomplete="tel">
          </label>
          <div class="form-row">
            <label>Date
              <input type="date" name="date" required>
            </label>
            <label>Time
              <input type="time" name="time" required>
            </label>
          </div>
          <div class="form-row">
            <label>Party size
              <input type="number" name="size" min="1" max="20" value="2" required>
            </label>
            <label>Location
              <select name="location" required>${locationOptions}</select>
            </label>
          </div>
          <label>Notes <span class="opt">(optional)</span>
            <textarea name="notes" rows="2" placeholder="Allergies, occasion, seating preference..."></textarea>
          </label>
          <button type="submit" class="btn-primary full">Confirm on WhatsApp</button>
        </form>
      </section>`;
  }

  function viewContact(){
    return `
      <section class="contact-page page-top">
        ${sectionHead("08 / Contact", "Say hello.", "General enquiries, press, or catering &mdash; reach us directly.")}
        <div class="contact-grid">
          <a class="contact-card reveal" href="https://wa.me/${WHATSAPP_NUMBER}" target="_blank" rel="noopener">
            <span class="contact-label">WhatsApp</span>
            <span class="contact-value">Message the team(01951467502) </span>
          </a>
          <a class="contact-card reveal" href="mailto:hello@eatos.example" target="_blank" rel="noopener">
            <span class="contact-label">Email</span>
            <span class="contact-value">asifuzzaman3761@gmail.com</span>
          </a>
          <a class="contact-card reveal" href="mailto:careers@eatos.example" target="_blank" rel="noopener">
            <span class="contact-label">Careers</span>
            <span class="contact-value">Join the kitchen</span>
          </a>
        </div>
      </section>`;
  }

  /* ---------------------------------------------------------
     Router
  --------------------------------------------------------- */
  const routes = {
    "/": { render: viewHome, title: "EATO'S — Feed the Imagination" },
    "/menu": { render: viewMenu, title: "Menu — EATO'S" },
    "/locations": { render: viewLocations, title: "Locations — EATO'S" },
    "/story": { render: viewStory, title: "Story — EATO'S" },
    "/book": { render: viewBook, title: "Reserve — EATO'S" },
    "/contact": { render: viewContact, title: "Contact — EATO'S" },
  };

  function currentPath(){
    const h = location.hash.replace(/^#/, "");
    return routes[h] ? h : "/";
  }

  function setActiveNav(path){
    document.querySelectorAll("[data-route]").forEach(a => {
      a.classList.toggle("active", a.dataset.route === path);
    });
  }

  function render(path){
    const match = routes[path] || routes["/"];
    app.innerHTML = match.render();
    document.title = match.title;
    setActiveNav(path);

    if(path === "/"){
      if(window.EatosScene) window.EatosScene.init();
      renderPicks();
    } else if(window.EatosScene){
      window.EatosScene.dispose();
    }

    if(path === "/menu") initMenu();
    if(path === "/book") initReserveForm();

    if(path === "/menu" && window.EatosVoice) window.EatosVoice.sayMenu();
    if(path === "/book" && window.EatosVoice) window.EatosVoice.sayBook();

    initReveal();
    window.scrollTo(0,0);
  }

  /* ---------------------------------------------------------
     Shutter transition
  --------------------------------------------------------- */
  const BAR_COUNT = bars.length;
  const BAR_STAGGER = 0.045;
  const BAR_DUR = 0.42;
  const totalSweep = (BAR_DUR + BAR_STAGGER * (BAR_COUNT - 1)) * 1000;

  function transitionTo(path){
    if(window.EatosAudio) window.EatosAudio.crunchBite();

    if(reduceMotion){
      render(path);
      return;
    }
    overlay.classList.add("active");
    bars.forEach((bar, i) => {
      bar.style.transitionDelay = (i * BAR_STAGGER) + "s";
      bar.style.transitionDuration = BAR_DUR + "s";
      bar.style.transform = "scaleY(1)";
    });

    setTimeout(() => {
      render(path);
      bars.forEach((bar, i) => {
        // reverse stagger on the way out, so the last bar in is the first out
        bar.style.transitionDelay = ((BAR_COUNT - 1 - i) * BAR_STAGGER) + "s";
        bar.style.transformOrigin = "bottom";
        bar.style.transform = "scaleY(0)";
      });
      setTimeout(() => {
        overlay.classList.remove("active");
        bars.forEach(bar => { bar.style.transformOrigin = "top"; });
      }, totalSweep + 80);
    }, totalSweep + 60);
  }

  function goTo(path){
    if(location.hash.replace(/^#/, "") === path){ render(path); return; }
    location.hash = path;
  }

  window.addEventListener("hashchange", () => transitionTo(currentPath()));

  /* ---------------------------------------------------------
     Delegated nav clicks (desktop + mobile overlay)
  --------------------------------------------------------- */
  document.addEventListener("click", (e) => {
    const routeEl = e.target.closest("[data-route]");
    if(routeEl){
      e.preventDefault();
      closeMobileNav();
      goTo(routeEl.dataset.route);
    }
  });

  /* ---------------------------------------------------------
     Mobile nav overlay
  --------------------------------------------------------- */
  const menuToggle = document.getElementById("menu-toggle");
  const mobileNav = document.getElementById("mobile-nav");
  function openMobileNav(){
    mobileNav.classList.add("open");
    menuToggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }
  function closeMobileNav(){
    mobileNav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }
  menuToggle.addEventListener("click", () => {
    mobileNav.classList.contains("open") ? closeMobileNav() : openMobileNav();
  });

  /* ---------------------------------------------------------
     Home — "Today's Picks" (one item pulled from each category)
  --------------------------------------------------------- */
  function renderPicks(){
    const grid = document.getElementById("picks-grid");
    if(!grid) return;
    const picks = window.EATOS_MENU.categories.map(cat => {
      const item = window.EATOS_MENU.items[cat.id][0];
      return { ...item, cat: cat.label };
    });
    grid.innerHTML = picks.map((p, i) => `
      <div class="pick-card reveal" style="--si:${i}">
        <span class="pick-cat">${p.cat}</span>
        <span class="pick-name">${p.name}</span>
        <span class="pick-price">${fmt(p.price)}</span>
      </div>`).join("");
    initReveal();
  }

  /* ---------------------------------------------------------
     Menu page — tabs + item rendering with shimmer + art layer
  --------------------------------------------------------- */
  function initMenu(){
    const tabsEl = document.getElementById("menu-tabs");
    const listEl = document.getElementById("menu-list");
    if(!tabsEl || !listEl) return;

    let currentCat = window.EATOS_MENU.categories[0].id;

    function renderTabs(){
      tabsEl.innerHTML = window.EATOS_MENU.categories.map(cat => `
        <button type="button" class="menu-tab${cat.id === currentCat ? " active" : ""}" data-cat="${cat.id}" role="tab" aria-selected="${cat.id === currentCat}">
          ${cat.label}
        </button>`).join("");
    }

    function renderItems(){
      const items = window.EATOS_MENU.items[currentCat] || [];
      const artHTML = `<div class="menu-art" aria-hidden="true"><span></span><span></span></div>`;
      listEl.innerHTML = artHTML + items.map((item, i) => `
        <div class="menu-item" style="--si:${i}">
          <span class="menu-item-name">${item.name}</span>
          <span class="menu-item-price">${fmt(item.price)}</span>
          <span class="menu-item-desc">${item.desc}</span>
        </div>`).join("");
      requestAnimationFrame(() => {
        listEl.querySelectorAll(".menu-item").forEach((el, i) => {
          setTimeout(() => el.classList.add("in"), i * 70);
        });
      });
    }

    renderTabs();
    renderItems();

    tabsEl.addEventListener("click", (e) => {
      const btn = e.target.closest(".menu-tab");
      if(!btn || btn.dataset.cat === currentCat) return;
      currentCat = btn.dataset.cat;
      renderTabs();
      renderItems();
    });
  }

  /* ---------------------------------------------------------
     Book page — reservation form -> WhatsApp handoff
  --------------------------------------------------------- */
  function initReserveForm(){
    const form = document.getElementById("reserve-form");
    if(!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const name = (fd.get("name") || "").toString().trim();
      const phone = (fd.get("phone") || "").toString().trim();
      const date = fd.get("date");
      const time = fd.get("time");
      const size = fd.get("size");
      const loc = fd.get("location");
      const notes = (fd.get("notes") || "").toString().trim();

      if(!name || !phone || !date || !time){
        toast("Please fill in your name, phone, date and time");
        return;
      }

      const text = encodeURIComponent(
        `Hi EATO'S — I'd like to reserve a table.\n\n` +
        `Name: ${name}\nPhone: ${phone}\nDate: ${date}\nTime: ${time}\nParty size: ${size}\nLocation: ${loc}` +
        (notes ? `\nNotes: ${notes}` : "")
      );
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, "_blank", "noopener");
      toast("Opening WhatsApp to confirm your reservation");
    });
  }

  /* ---------------------------------------------------------
     Toasts
  --------------------------------------------------------- */
  const toastRoot = document.getElementById("toast-root");
  function toast(msg){
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;
    toastRoot.appendChild(el);
    requestAnimationFrame(() => el.classList.add("show"));
    setTimeout(() => {
      el.classList.remove("show");
      setTimeout(() => el.remove(), 400);
    }, 2600);
  }

  /* ---------------------------------------------------------
     Scroll reveal (re-bound after every render)
  --------------------------------------------------------- */
  let io = null;
  function initReveal(){
    const targets = app.querySelectorAll(".reveal:not(.in-view)");
    if(reduceMotion || !("IntersectionObserver" in window)){
      targets.forEach(el => el.classList.add("in-view"));
      return;
    }
    if(io) io.disconnect();
    io = new IntersectionObserver((entries) => {
      entries.forEach((entry, idx) => {
        if(entry.isIntersecting){
          setTimeout(() => entry.target.classList.add("in-view"), (idx % 4) * 80);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -60px 0px" });
    targets.forEach(el => io.observe(el));
  }

  /* ---------------------------------------------------------
     Initial render
  --------------------------------------------------------- */
  render(currentPath());
})();
