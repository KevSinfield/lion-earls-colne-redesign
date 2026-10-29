(function () {
  var D = window.LION;
  var $ = function (s) { return document.querySelector(s); };
  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  function fmt(h) {
    h = h % 24;
    var hh = Math.floor(h), mm = Math.round((h - hh) * 60);
    var h12 = hh % 12 === 0 ? 12 : hh % 12;
    return h12 + (mm ? ":" + String(mm).padStart(2, "0") : "") + (hh >= 12 ? "pm" : "am");
  }

  // Static content from the data file
  $("#addr").textContent = D.address;
  $("#fb").href = D.facebook;
  $("#mapLink").href = D.mapsUrl;
  $("#mapOpen").href = D.mapsUrl;
  var ph = $("#phone");
  ph.textContent = D.phone;
  ph.href = "tel:" + D.phone.replace(/\s/g, "");
  $("#stickyCall").href = ph.href;
  document.querySelectorAll("[data-book]").forEach(function (a) {
    if (D.bookingUrl) { a.href = D.bookingUrl; a.rel = "noopener"; }
    else { a.href = "#find"; a.title = "Online booking coming soon"; }  // waiting for the Stampede link
  });

  // Week. The nights the Lion promotes come from js/data.js; any other open day with a kitchen (Thursday) is filled in from the opening hours, so today is always in the list.
  var WEEK = [2, 3, 4, 5, 6, 0].map(function (d) {
    var w = D.week.filter(function (x) { return x.day === DAYS[d]; })[0];
    if (w) return w;
    var h = D.hours[d];
    if (!h || !h.kitchen.length) return null;
    var lunch = h.kitchen.some(function (k) { return k[0] < 16; }), eve = h.kitchen.some(function (k) { return k[0] >= 16; });
    return { day: DAYS[d], title: "Open until " + fmt(h.close), note: "Food " + (lunch && eve ? "lunch and evening" : eve ? "evening" : "lunchtime") };
  }).filter(Boolean);
  WEEK.forEach(function (w) {
    var li = document.createElement("li");
    li.innerHTML = "<span class='wk__d'></span><strong></strong><span class='wk__n'></span>";
    li.children[0].textContent = w.day;
    li.children[1].textContent = w.title;
    li.children[2].textContent = w.note;
    $("#weekList").appendChild(li);
  });

  // The week band's photo follows the day (?at=2026-10-28T12:00 previews another day).
  // Thursday and Saturday have no photo of their own yet, so they show the food.
  (function () {
    var at = new URLSearchParams(location.search).get("at");
    var dow = (at ? new Date(at) : new Date()).getDay();
    var DAYNAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var FRONT = ["images/lion-front.jpg", "center 70%", "The front of the Lion, with its painted Bar and Dining lettering"];
    var PLATES = ["images/plates.jpg", "center 35%", "A member of the Lion team carrying a bowl of chips and a rice bowl topped with chilli and spring onion"];
    var PHOTOS = {  // the photo follows the day: roast, poker, pizza, tapas. Thursday and Saturday have no night of their own, so they show plates of food from the Lion's own posts; Monday (closed) shows the pub.
      0: ["images/roast.jpg", "center 65%", "Sunday roast beef with a Yorkshire pudding, gravy and a glass of red wine"],
      1: FRONT, 4: PLATES, 6: PLATES,
      2: ["images/poker-night.jpg", "center 40%", "Poker night at the Lion, players around an orange poker table under the old beams"],
      3: ["images/pizza.jpg", "center 55%", "A wood-fired pizza topped with burrata, Parma ham and rocket"],
      5: ["images/tapas.jpg", "center", "Two small plates and a glass of red wine on the table"]
    };
    var ph = $("#weekPhoto"), p = PHOTOS[dow];
    if (ph && p) {
      ph.style.backgroundImage = "url(" + p[0] + ")";
      ph.style.backgroundPosition = p[1];
      ph.setAttribute("aria-label", p[2]);
    }
    var today = WEEK.filter(function (w) { return w.day === DAYNAMES[dow]; })[0];
    document.querySelectorAll("#weekList li").forEach(function (li, i) {
      if (WEEK[i] && WEEK[i].day === DAYNAMES[dow]) li.className = "is-today";
    });
    var label = today ? "Today: " + today.title : (!D.hours[dow] ? "Closed today" : "");
    if (ph && label) {
      var chip = document.createElement("div");
      chip.className = "ph__day"; chip.textContent = label;
      ph.appendChild(chip);
    }
  })();

  // Hours table
  [1, 2, 3, 4, 5, 6, 0].forEach(function (d) {
    var h = D.hours[d], tr = document.createElement("tr"), food = "";
    if (h && h.kitchen.length) food = "Food " + h.kitchen.map(function (k) { return fmt(k[0]) + " to " + fmt(k[1]); }).join(" and ");
    else if (h && h.note) food = h.note;
    tr.innerHTML = "<th></th><td></td><td></td>";
    tr.children[0].textContent = DAYS[d];
    tr.children[1].textContent = h ? fmt(h.open) + " to " + fmt(h.close) : "Closed";
    tr.children[2].textContent = food;
    var atParam = new URLSearchParams(location.search).get("at");
    if (d === (atParam ? new Date(atParam) : new Date()).getDay()) {
      tr.className = "is-today";
      var tag = document.createElement("span"); tag.className = "hours__today"; tag.textContent = "Today";
      tr.children[0].appendChild(tag);
    }
    $("#hours").appendChild(tr);
  });

  // Live labels and the "Coming up" strip. ?at=2026-10-31T18:00 previews another date and time.
  var NOW = new URLSearchParams(location.search).get("at") ? new Date(new URLSearchParams(location.search).get("at")) : new Date();
  function p2(n) { return String(n).padStart(2, "0"); }
  function isoDay(d) { return d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate()); }
  function fromIso(s) { var a = s.split("-"); return new Date(+a[0], +a[1] - 1, +a[2]); }
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function when(e) {
    var d = fromIso(e.date);
    return DAYS[d.getDay()].slice(0, 3) + " " + d.getDate() + " " + MONTHS[d.getMonth()];
  }
  function inDays(n) { return n === 0 ? "Today" : n === 1 ? "Tomorrow" : n <= 14 ? "In " + n + " days" : ""; }

  // A designed event card, drawn from the event data in the Lion's own style (replaces the Facebook poster on the home page; the poster stays on the event's own page).
  function eventCard(e) {
    var card = el("div", "ecard ecard--" + (e.type === "party" ? "party" : "plain"));
    card.setAttribute("aria-hidden", "true");
    var crest = document.createElement("img"); crest.className = "ecard__crest"; crest.src = "images/logo-light.png"; crest.alt = ""; crest.width = 64; crest.height = 64;
    card.appendChild(crest);
    if (e.date) {
      var d = fromIso(e.date);
      card.appendChild(el("p", "ecard__day", DAYS[d.getDay()]));
      card.appendChild(el("p", "ecard__num", String(d.getDate())));
      card.appendChild(el("p", "ecard__mon", ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][d.getMonth()]));
    } else {
      card.classList.add("ecard--rec");
      card.appendChild(el("p", "ecard__day", "Every week"));
      card.appendChild(el("p", "ecard__num", e.recurs || ""));
    }
    card.appendChild(el("p", "ecard__t", e.short || e.title));
    var meta = [e.time, e.price].filter(Boolean).join(" \u00b7 ");
    if (meta) card.appendChild(el("p", "ecard__m", meta));
    return card;
  }

  function renderSoon(events) {
    var today = isoDay(NOW), todayDate = fromIso(today);
    var real = events.filter(function (e) { return !e.sample; });  // never show the invented sample nights
    var dated = real.filter(function (e) { return e.date && e.date >= today; })
      .sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    var picks = dated.slice(0, 2).map(function (e) {
      return { e: e, n: Math.round((fromIso(e.date) - todayDate) / 86400000), line: when(e) + (e.time ? " · " + e.time : "") };
    });
    if (picks.length < 2) {  // quiet week: fill with the regular nights, soonest first
      real.filter(function (e) { return e.recurs; }).map(function (e) {
        var n = (DAYS.indexOf(e.recurs) - todayDate.getDay() + 7) % 7;
        return { e: e, n: n, line: "Every " + e.recurs + (e.time ? " · " + e.time : "") };
      }).sort(function (a, b) { return a.n - b.n; }).slice(0, 2 - picks.length).forEach(function (x) { picks.push(x); });
    }
    var first = dated[0];
    if (first && Math.round((fromIso(first.date) - todayDate) / 86400000) <= 21) {
      var nx = $("#sheetNext");
      nx.innerHTML = "<small></small><span></span>";
      nx.children[0].textContent = "Next up";
      nx.children[1].textContent = (first.short || first.title) + ", " + DAYS[fromIso(first.date).getDay()].slice(0, 3) + " " + fromIso(first.date).getDate() + " " + MONTHS[fromIso(first.date).getMonth()];
      nx.hidden = false;
    }
    if (!picks.length) return;
    var grid = $("#soonGrid");
    grid.className = "soon__grid soon__grid--" + picks.length;
    $("#soonSub").textContent = !dated.length ? "On every week at the Lion." : picks.length > 1 && picks[1].e.date ? "Two nights to put in the diary." : "Next up at the Lion.";
    picks.forEach(function (x) {
      var a = document.createElement("a");
      a.className = "soon__card"; a.href = "event.html?id=" + encodeURIComponent(x.e.id);
      var pic = document.createElement("div"); pic.className = "soon__pic";
      pic.appendChild(eventCard(x.e));
      var chip = inDays(x.n);
      if (chip && x.n <= 7) { var c = document.createElement("span"); c.className = "soon__chip"; c.textContent = x.n === 0 && x.e.recurs ? "Tonight" : chip; pic.appendChild(c); }
      var w = document.createElement("span"); w.className = "soon__when"; w.textContent = x.line;
      var h = document.createElement("h3"); h.textContent = x.e.title;
      a.appendChild(pic); a.appendChild(w); a.appendChild(h); grid.appendChild(a);
    });
    $("#soon").hidden = false;
  }
  fetch("data/sample/events.json", { cache: "no-cache" }).then(function (r) { return r.json(); })
    .then(function (d) { renderSoon(d.events || []); weekEvent(d.events || []); }).catch(function () {});

  // A dated event on today's date (not a weekly night) takes over the week band: its poster or photo replaces the day's usual picture, and today's row names it.
  function weekEvent(events) {
    var today = isoDay(NOW);
    var e = events.filter(function (x) { return !x.sample && x.date === today && x.image; })[0];
    var ph = $("#weekPhoto");
    if (!e || !ph) return;
    ph.style.backgroundImage = "none";
    ph.className = "ph ph--poster";
    ph.removeAttribute("role"); ph.removeAttribute("aria-label");
    ph.insertBefore(eventCard(e), ph.firstChild);
    var chip = ph.querySelector(".ph__day");
    if (!chip) { chip = document.createElement("div"); chip.className = "ph__day"; ph.appendChild(chip); }
    chip.textContent = "Today: " + (e.short || e.title);
    var li = document.querySelector("#weekList li.is-today");
    if (li) { li.children[1].textContent = e.short || e.title; li.children[2].textContent = e.time || ""; }
  }

  // The big live line and today's timeline. Hours come from js/data.js only. ?at=2026-10-31T18:00 previews another time.
  function today() {
    var d = NOW.getDay(), t = NOW.getHours() + NOW.getMinutes() / 60, h = D.hours[d], day = d, tt = t;
    var yest = D.hours[(d + 6) % 7];
    if (yest && yest.close > 24 && t < yest.close - 24) { h = yest; day = (d + 6) % 7; tt = t + 24; }  // still open from last night
    return { d: d, t: tt, h: h, day: day };
  }
  function nextOpen(d) {
    for (var i = 1; i <= 7; i++) {
      var nd = (d + i) % 7;
      if (D.hours[nd]) return (i === 1 ? "tomorrow" : DAYS[nd]) + " at " + fmt(D.hours[nd].open);
    }
    return "";
  }
  // When the kitchen next fires up: "tomorrow from 12:30pm", "Wednesday from 5:30pm". Looks at the rest of today first.
  function nextFood() {
    var t = NOW.getHours() + NOW.getMinutes() / 60, d = NOW.getDay();
    for (var i = 0; i <= 7; i++) {
      var nd = (d + i) % 7, hh = D.hours[nd];
      if (!hh) continue;
      var w = hh.kitchen.filter(function (k) { return i > 0 || k[0] > t; })[0];
      if (w) return (i === 0 ? "today" : i === 1 ? "tomorrow" : DAYS[nd]) + " from " + fmt(w[0]);
    }
    return "";
  }
  function status() {
    var T = today(), h = T.h, lead = "", em = "", open = false, sub = "";
    if (h && T.t >= h.open && T.t < h.close) {
      open = true; lead = "Open now.";
      var k = h.kitchen.filter(function (w) { return T.t >= w[0] && T.t < w[1]; })[0];
      var nxt = h.kitchen.filter(function (w) { return T.t < w[0]; })[0];
      if (k) em = "Kitchen until " + fmt(k[1]) + ".";
      else if (nxt) em = "Kitchen from " + fmt(nxt[0]) + ".";
      else if (!h.kitchen.length) em = "Drinks only.";
      else em = "Kitchen closed. Open until " + fmt(h.close) + ".";
    } else if (h && T.t < h.open) { lead = "Opens at " + fmt(h.open) + "."; em = h.kitchen.length ? "Kitchen from " + fmt(h.kitchen[0][0]) + "." : "Drinks only today."; }
    else { lead = "Closed."; em = "Opens " + nextOpen(T.d) + "."; }
    // The line under the headline follows the day, so a quiet kitchen is never sat above a pizza pitch.
    if (/^Drinks only/.test(em) || /^Kitchen closed/.test(em) || lead === "Closed.") {
      var note = h && h.note ? h.note.replace(/^Drinks only\.?\s*/, "").replace(/\.$/, "") : "";
      var nf = nextFood();
      sub = (note ? note + ". " : "") + (nf ? "Food returns " + nf + "." : "");
    }
    if (sub) $("#saySub").textContent = sub;
    $("#saySub").classList.toggle("is-state", !!sub);
    $("#sayLead").textContent = lead;
    $("#sayEm").textContent = em;
    $("#status").classList.toggle("is-open", open);
  }
  status();

  (function sheet() {
    var T = today(), h = T.h, rail = $("#rail");
    $("#sheetDate").textContent = DAYS[NOW.getDay()] + " " + NOW.getDate() + " " + MONTHS[NOW.getMonth()];
    var rows = [];
    if (h) {
      rows.push({ at: h.open, t: fmt(h.open), h: "Doors open", p: "Bar open" });
      h.kitchen.forEach(function (w, i) {
        rows.push({ at: w[0], end: w[1], t: fmt(w[0]) + "<br>to " + fmt(w[1]), h: "Kitchen",
          p: h.kitchen.length > 1 ? (w[0] < 16 ? "Lunch" : "Evening") : "" });
      });
      rows.push({ at: h.close, t: fmt(h.close), h: "Close", p: "" });
    }
    // "Now" sits on the kitchen window we are inside; between windows (or with no kitchen) it sits on "Doors open".
    var cur = -1, closeAt = h ? h.close : 0;
    rows.forEach(function (r, i) { if (r.end && r.at <= T.t && T.t < r.end) cur = i; });
    if (cur < 0 && h && T.t >= h.open && T.t < closeAt) cur = 0;
    rows.forEach(function (r, i) {
      var li = document.createElement("li");
      li.innerHTML = "<span class='rail__t'></span><span class='rail__m' aria-hidden='true'></span><div><span class='rail__h'></span><span class='rail__p'></span></div>";
      li.children[0].innerHTML = r.t;
      li.children[2].children[0].textContent = r.h;
      li.children[2].children[1].textContent = r.p;
      var past = r.end ? r.end <= T.t : r.at <= T.t;
      if (i === cur) {
        li.className = "is-now";
        var b = document.createElement("b"); b.className = "rail__badge"; b.textContent = "Now";
        li.children[2].children[0].appendChild(b);
      } else if (past) li.className = "is-done";
      rail.appendChild(li);
    });
    if (!h) { var li = document.createElement("li"); li.innerHTML = "<span class='rail__t'></span><span class='rail__m' aria-hidden='true'></span><div><span class='rail__h'>Closed today</span><span class='rail__p'></span></div>"; li.children[2].children[1].textContent = "Opens " + nextOpen(T.d) + "."; rail.appendChild(li); }
    if (h && h.note) { var n = $("#railNote"); n.textContent = h.note + "."; n.hidden = false; }
  })();

  // Menu panel. Menus come from data/menu.json; anything past its valid_to date is hidden.
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }
  function servedNow(m) {
    var now = new Date(), t = now.getHours() + now.getMinutes() / 60, d = now.getDay();
    return (m.served || []).some(function (w) { return (w.days || []).indexOf(d) > -1 && t >= w.from && t < w.to; });
  }
  // Dated menus (this week's specials) first, then whatever is being served right now, then the rest in file order.
  function liveMenus(menus, today) {
    function rank(m) { return m.valid_to ? 0 : servedNow(m) ? 1 : 2; }
    return menus.filter(function (m) { return !m.valid_to || m.valid_to >= today; })
      .sort(function (a, b) { return rank(a) - rank(b); });
  }
  function renderMenu(m) {
    var box = el("div", "menu");
    box.appendChild(el("h3", "menu__title", m.title.replace(/\s*\(demo\)$/i, "")));
    if (m.subtitle) box.appendChild(el("p", "menu__sub", m.subtitle));
    if (m.intro) box.appendChild(el("p", "menu__intro", m.intro));
    var acts = el("div", "menu__acts");
    if (m.pdf) {
      var dl = el("a", "btn btn--line btn--sm", "Download PDF");
      dl.href = m.pdf; dl.setAttribute("download", "");
      acts.appendChild(dl);
    }
    var full = el("a", "menu__full", "Open full page");
    full.href = "menu.html?id=" + encodeURIComponent(m.id);
    acts.appendChild(full);
    box.appendChild(acts);
    var jump = null;
    if (m.sections.length > 2) {
      jump = el("div", "menu__jump");
      box.appendChild(jump);
    }
    m.sections.forEach(function (s) {
      var h = el("h3", null, s.name);
      box.appendChild(h);
      if (jump) {
        var j = el("button", null, s.name.replace(/^Our /, ""));
        j.type = "button";
        j.addEventListener("click", function () { h.scrollIntoView({ behavior: "smooth", block: "start" }); });
        jump.appendChild(j);
      }
      if (s.note) box.appendChild(el("p", "menu__note", s.note));
      s.items.forEach(function (it) {
        var row = el("div", "dish");
        var left = el("div");
        if (it.label) left.appendChild(el("em", "dish__label", it.label));
        var name = el("strong", null, it.name);
        left.appendChild(name);
        it.tags.forEach(function (t) { name.appendChild(el("span", "dish__tag", t)); });
        if (it.description) left.appendChild(el("span", "dish__d", it.description));
        row.appendChild(left);
        if (it.price != null) row.appendChild(el("b", "dish__p", "£" + it.price.toFixed(2)));
        box.appendChild(row);
      });
    });
    (m.offers || []).forEach(function (o) {
      var b = el("div", "offer");
      b.appendChild(el("span", "offer__t", o.title));
      b.appendChild(el("strong", null, o.headline));
      if (o.detail) b.appendChild(el("span", "offer__d", o.detail));
      box.appendChild(b);
    });
    if (m.footnote) box.appendChild(el("p", "menu__foot", m.footnote));
    if (m.todo) box.appendChild(el("p", "todo", m.todo));
    return box;
  }
  function renderMenus(menus, today) {
    var body = $("#menuBody"), live = liveMenus(menus, today);
    body.textContent = "";
    if (!live.length) { body.appendChild(el("p", null, "Menu coming soon. Give us a call on " + D.phone + ".")); return; }
    var tabs = el("div", "tabs"), shown = [], btns = [], cur = 0;
    tabs.setAttribute("role", "tablist");
    function select(i, focus) {
      cur = (i + live.length) % live.length;
      shown.forEach(function (p, k) { p.hidden = k !== cur; });
      btns.forEach(function (t, k) { t.classList.toggle("on", k === cur); t.setAttribute("aria-selected", k === cur ? "true" : "false"); t.tabIndex = k === cur ? 0 : -1; });
      tabs.scrollLeft = btns[cur].offsetLeft - (tabs.clientWidth - btns[cur].offsetWidth) / 2;
      if (focus) btns[cur].focus();
      var box = body.closest(".panel__box"); if (box) box.scrollTop = 0;
    }
    live.forEach(function (m, i) {
      var pane = renderMenu(m); pane.hidden = i > 0; shown.push(pane);
      var tab = el("button", "tab" + (servedNow(m) ? " tab--now" : ""), m.title);
      tab.type = "button"; tab.setAttribute("role", "tab");
      tab.addEventListener("click", function () { select(i); });
      tab.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight") { e.preventDefault(); select(cur + 1, true); }
        else if (e.key === "ArrowLeft") { e.preventDefault(); select(cur - 1, true); }
      });
      btns.push(tab); tabs.appendChild(tab);
    });
    if (live.length > 1) {
      body.appendChild(tabs);
      // Swipe left or right on a phone to move to the next or previous menu
      var x0 = null, y0 = null;
      body.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
      body.addEventListener("touchend", function (e) {
        if (x0 === null) return;
        var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
        x0 = null;
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) select(cur + (dx < 0 ? 1 : -1));
      }, { passive: true });
      body.appendChild(el("p", "menu__hint", "Swipe or use the tabs to see the other menus."));
    }
    shown.forEach(function (p) { body.appendChild(p); });
    if (live.length > 1) select(0);
  }
  window.LION_renderMenus = renderMenus; // exposed so the date rules can be tested
  var todayISO = new Date().toISOString().slice(0, 10);
  fetch("data/menu.json", { cache: "no-cache" }).then(function (r) { return r.json(); })
    .then(function (d) { renderMenus(d.menus, todayISO); })
    .catch(function () { $("#menuBody").textContent = "Menu coming soon. Give us a call on " + D.phone + "."; });
  var panel = $("#panel"), opener = null;
  function openPanel(e) { opener = e.currentTarget; panel.hidden = false; document.body.classList.add("lock"); panel.querySelector(".panel__x").focus(); }
  function closePanel() { panel.hidden = true; document.body.classList.remove("lock"); if (opener) opener.focus(); }
  document.querySelectorAll("[data-menu]").forEach(function (b) { b.addEventListener("click", openPanel); });
  panel.querySelector(".panel__x").addEventListener("click", closePanel);
  panel.addEventListener("click", function (e) { if (e.target === panel) closePanel(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) closePanel(); });

  // Sticky bottom bar (phones) appears once the hero actions have scrolled away
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (e) { $(".sticky").classList.toggle("show", !e[0].isIntersecting); }).observe($(".today__act"));
  } else { $(".sticky").classList.add("show"); }

  // Sign-up (mock only)
  document.querySelectorAll(".js-join").forEach(function (f) {
    f.addEventListener("submit", function (e) { e.preventDefault(); f.querySelector(".ok").hidden = false; });
  });
})();
