/* Textdetektive: App-Logik. Reines JavaScript, keine Abhängigkeiten, nichts geht ins Netz. */
(function () {
  "use strict";

  var D = window.TEXTDETEKTIVE;
  var $ = function (id) { return document.getElementById(id); };
  var main = $("main");

  /* ---------- Hilfsfunktionen ---------- */

  function h(tag, attrs, kids) {
    var el = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === "class") el.className = v;
        else if (k === "text") el.textContent = v;
        else if (k.indexOf("on") === 0) el.addEventListener(k.slice(2), v);
        else el.setAttribute(k, v === true ? "" : v);
      });
    }
    (kids || []).forEach(function (c) {
      if (c === null || c === undefined || c === false) return;
      el.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return el;
  }

  function bild(pose, alt) {
    return h("img", { src: "assets/detektiv-" + pose + ".png", alt: alt || "", width: 480, height: 480 });
  }

  function reinWort(t) {
    return t.replace(/[.,;:!?"„“”()]+/g, "");
  }

  /* ---------- Speicher (nur lokal, immer abgesichert) ---------- */

  var store = { done: {}, ampel: {} };

  function laden() {
    try {
      var raw = window.localStorage.getItem(D.speicherSchluessel);
      if (!raw) return;
      var obj = JSON.parse(raw);
      if (obj && typeof obj === "object") {
        store.done = obj.done && typeof obj.done === "object" ? obj.done : {};
        store.ampel = obj.ampel && typeof obj.ampel === "object" ? obj.ampel : {};
      }
    } catch (e) { /* App läuft auch ohne Speicher */ }
  }

  function speichern() {
    try { window.localStorage.setItem(D.speicherSchluessel, JSON.stringify(store)); } catch (e) { /* egal */ }
  }

  function loeschen() {
    store = { done: {}, ampel: {} };
    try { window.localStorage.removeItem(D.speicherSchluessel); } catch (e) { /* egal */ }
  }

  /* ---------- Daten aufbereiten ---------- */

  function parseSatz(s) {
    var tokens = [], cur = "", curM = false, inB = false;
    function flush() { if (cur) { tokens.push({ t: cur, m: curM }); cur = ""; curM = false; } }
    for (var i = 0; i < s.length; i++) {
      var ch = s.charAt(i);
      if (ch === "[") { inB = true; continue; }
      if (ch === "]") { inB = false; continue; }
      if (/\s/.test(ch)) { flush(); continue; }
      cur += ch;
      if (inB) curM = true;
    }
    flush();
    return tokens;
  }

  function schritteFuer(stufe) {
    var list = [];
    stufe.einheiten.forEach(function (e) {
      var zaehlt = e.zaehlt !== false;
      var saetze = e.saetze ? e.saetze.map(parseSatz) : null;
      if (saetze) {
        list.push({
          key: stufe.id + "/" + e.id + "-m", kind: "mark", einheit: e, saetze: saetze, zaehlt: zaehlt,
          name: e.titel
        });
      }
      (e.fragen || []).forEach(function (f, i) {
        list.push({
          key: stufe.id + "/" + e.id + "-q" + i, kind: "frage", einheit: e, frage: f, zaehlt: zaehlt,
          text: saetze, name: e.fragen.length > 1 ? e.titel + ", Frage " + (i + 1) : e.titel + ", Frage"
        });
      });
      if (e.ampel) {
        list.push({ key: stufe.id + "/" + e.id + "-ampel", kind: "ampel", einheit: e, zaehlt: false, name: e.titel + ", Selbsteinschätzung" });
      }
    });
    return list;
  }

  var steps = D.stufen.map(schritteFuer);

  function zaehlStand(si) {
    var ges = 0, ok = 0;
    steps[si].forEach(function (s) {
      if (!s.zaehlt) return;
      ges++;
      if (store.done[s.key]) ok++;
    });
    return { ges: ges, ok: ok };
  }

  /* ---------- Zustand der Ansicht (nur im Speicher) ---------- */

  var view = { name: "start", si: 0, idx: 0 };
  var sess = { sel: {}, streich: {}, wahl: {} };

  function selFor(step) {
    if (!sess.sel[step.key]) sess.sel[step.key] = step.saetze.map(function () { return {}; });
    return sess.sel[step.key];
  }

  /* ---------- Seitenrahmen ---------- */

  function rahmen() {
    var istStart = view.name === "start";
    document.body.classList.toggle("is-start", istStart);
    $("topbar").hidden = istStart;
    $("nav").hidden = istStart;

    var pct = 0;
    if (view.name === "step") pct = Math.round(((view.idx + 1) / (steps[view.si].length + 1)) * 100);
    if (view.name === "finish") pct = 100;
    $("progress-bar").style.width = pct + "%";
    $("progress").setAttribute("aria-valuenow", String(pct));

    if (!istStart) {
      var stufe = D.stufen[view.si];
      $("crumb").textContent = view.name === "step"
        ? stufe.titel + ", " + (view.idx + 1) + " von " + steps[view.si].length
        : stufe.titel + ", geschafft";
      $("next-btn").textContent = view.name === "finish" ? "Zur Auswahl" : "Weiter";
    }
  }

  function zeige(inhalt) {
    main.innerHTML = "";
    main.appendChild(inhalt);
    rahmen();
    window.scrollTo(0, 0);
    try { main.focus({ preventScroll: true }); } catch (e) { /* alte Browser */ }
  }

  /* ---------- Startbildschirm ---------- */

  function renderStart() {
    view = { name: "start", si: 0, idx: 0 };
    var wrap = h("div", null, [
      h("div", { class: "start-head" }, [
        bild("lupe", "Der Textdetektiv hält eine Lupe"),
        h("h1", { text: "Textdetektive" }),
        h("p", { class: "lead", text: "Finde in jedem Text die wichtigen Wörter. Such dir eine Stufe aus." })
      ]),
      h("div", { class: "stufen" }, D.stufen.map(function (stufe, si) {
        var st = zaehlStand(si);
        var fertig = st.ges > 0 && st.ok === st.ges;
        return h("button", {
          type: "button", class: "stufe" + (fertig ? " fertig" : ""), "data-stufe": stufe.id,
          onclick: function () { starteStufe(si); }
        }, [
          h("span", { class: "nr" + (stufe.nummer.length > 1 ? " klein" : ""), text: stufe.nummer }),
          h("span", { class: "txt" }, [
            h("span", { class: "t", text: stufe.titel }),
            h("span", { class: "u", text: stufe.untertitel })
          ]),
          h("span", { class: "st", text: st.ok + " von " + st.ges + " geschafft" })
        ]);
      })),
      h("section", { class: "schritte" }, [
        h("h2", { text: "Die 4 Detektiv-Schritte" }),
        h("ol", null, D.schritte.map(function (t) { return h("li", { text: t }); }))
      ]),
      h("div", { class: "reset" }, [
        h("button", { type: "button", class: "textbtn", id: "reset-btn", text: "Von vorn anfangen", onclick: oeffneModal })
      ])
    ]);
    zeige(wrap);
  }

  function starteStufe(si) {
    var liste = steps[si];
    var idx = 0;
    for (var i = 0; i < liste.length; i++) {
      if (liste[i].zaehlt && !store.done[liste[i].key]) { idx = i; break; }
    }
    gehZu(si, idx);
  }

  function gehZu(si, idx) {
    view = { name: "step", si: si, idx: idx };
    renderStep();
  }

  /* ---------- Schritte ---------- */

  function renderStep() {
    var step = steps[view.si][view.idx];
    if (step.kind === "mark") return renderMark(step);
    if (step.kind === "frage") return renderFrage(step);
    return renderAmpel(step);
  }

  function kopf(pose, step, titel, text) {
    var geschafft = store.done[step.key] && step.zaehlt;
    return h("div", { class: "kopf" }, [
      bild(pose, ""),
      h("div", null, [
        h("h1", null, [titel, geschafft ? h("span", { class: "badge", text: "Geschafft" }) : null]),
        text ? h("p", { text: text }) : null
      ])
    ]);
  }

  function setBadge(step) {
    var h1 = main.querySelector("h1");
    if (h1 && !h1.querySelector(".badge") && step.zaehlt) h1.appendChild(h("span", { class: "badge", text: "Geschafft" }));
  }

  /* --- Markieren --- */

  function renderMark(step) {
    var sel = selFor(step);
    var anweisung = step.einheit.anweisung || "Tippe die wichtigen Wörter an.";
    var karte = h("div", { class: "karte", id: "karte" });
    var infos = [];

    step.saetze.forEach(function (tokens, sIdx) {
      var worte = h("div", { class: "worte" });
      tokens.forEach(function (tok, tIdx) {
        var b = h("button", {
          type: "button", class: "tok", "aria-pressed": sel[sIdx][tIdx] ? "true" : "false",
          "data-s": String(sIdx), "data-t": String(tIdx), text: tok.t,
          onclick: function () { toggleWort(step, sIdx, tIdx, b); }
        });
        worte.appendChild(b);
      });
      var info = h("div", { class: "satzinfo", "data-info": String(sIdx) });
      infos.push(info);
      karte.appendChild(h("div", { class: "satz" }, [worte, info]));
    });

    var notiz = h("p", { class: "notiz", id: "streich-notiz", hidden: true,
      text: "So liest sich dein Text nur mit den Marker-Wörtern. Verstehst du noch, worum es geht?" });
    var feedback = h("div", { class: "feedback", id: "feedback", role: "status", "aria-live": "polite", hidden: true });

    var streichBtn = h("button", { type: "button", class: "btn btn-ghost", id: "streich-btn", "aria-pressed": "false", text: "Streich-Test" });
    var pruefBtn = h("button", { type: "button", class: "btn btn-marker", id: "pruef-btn", text: "Prüfen" });
    streichBtn.addEventListener("click", function () { setStreich(step, !sess.streich[step.key]); });
    pruefBtn.addEventListener("click", function () { pruefeMark(step); });

    var wrap = h("div", null, [
      kopf("marker", step, step.einheit.titel, anweisung + " Höchstens 3 Marker pro Satz."),
      karte, notiz,
      h("div", { class: "btnrow" }, [streichBtn, pruefBtn]),
      feedback
    ]);
    zeige(wrap);
    sess.streich[step.key] = false;
    sel.forEach(function (_, i) { zaehleInfo(step, i); });
  }

  function toggleWort(step, sIdx, tIdx, btn) {
    var sel = selFor(step);
    if (sel[sIdx][tIdx]) delete sel[sIdx][tIdx]; else sel[sIdx][tIdx] = true;
    btn.setAttribute("aria-pressed", sel[sIdx][tIdx] ? "true" : "false");
    loescheCheck();
    zaehleInfo(step, sIdx);
  }

  function loescheCheck() {
    var karte = $("karte");
    if (!karte) return;
    [].forEach.call(karte.querySelectorAll(".tok"), function (b) { b.classList.remove("ok", "missing", "extra"); });
    [].forEach.call(karte.querySelectorAll(".satzinfo"), function (i) { i.innerHTML = ""; });
    var fb = $("feedback");
    fb.hidden = true;
    fb.innerHTML = "";
    fb.className = "feedback";
  }

  function zaehleInfo(step, sIdx) {
    var info = main.querySelector('[data-info="' + sIdx + '"]');
    if (!info) return;
    info.innerHTML = "";
    var n = Object.keys(selFor(step)[sIdx]).length;
    if (n > D.maxMarkerProSatz) {
      info.appendChild(h("p", { class: "viel", text: "Das sind schon viele Marker in diesem Satz. Höchstens " + D.maxMarkerProSatz + " sind ein guter Wert." }));
    }
  }

  function setStreich(step, an) {
    sess.streich[step.key] = an;
    var karte = $("karte");
    karte.classList.toggle("streich", an);
    var b = $("streich-btn");
    b.setAttribute("aria-pressed", an ? "true" : "false");
    b.textContent = an ? "Zurück zum Text" : "Streich-Test";
    var n = $("streich-notiz");
    n.hidden = !an;
    if (an) {
      var count = 0;
      selFor(step).forEach(function (s) { count += Object.keys(s).length; });
      n.textContent = count === 0
        ? "Du hast noch nichts markiert. Markiere zuerst die wichtigen Wörter."
        : "So liest sich dein Text nur mit den Marker-Wörtern. Verstehst du noch, worum es geht?";
    }
  }

  /* Reine Auswertung, ohne DOM. Wird von der Oberfläche benutzt. */
  function bewerte(tokens, auswahl) {
    var fehlt = [], zuviel = [], richtig = [];
    tokens.forEach(function (tok, i) {
      var gewaehlt = !!auswahl[i];
      if (tok.m && gewaehlt) richtig.push(i);
      else if (tok.m && !gewaehlt) fehlt.push(i);
      else if (!tok.m && gewaehlt) zuviel.push(i);
    });
    return { fehlt: fehlt, zuviel: zuviel, richtig: richtig, gut: fehlt.length === 0 && zuviel.length <= D.maxZusatzProSatz };
  }

  function pruefeMark(step) {
    if (sess.streich[step.key]) setStreich(step, false);
    loescheCheck();
    var sel = selFor(step);
    var gesamt = 0;
    sel.forEach(function (s) { gesamt += Object.keys(s).length; });
    var fb = $("feedback");
    fb.hidden = false;

    if (gesamt === 0) {
      fb.className = "feedback nochmal";
      fb.appendChild(h("strong", { text: "Fang einfach an." }));
      fb.appendChild(document.createTextNode("Lies den Text zuerst ganz. Dann tippe die wichtigen Wörter an."));
      return;
    }

    var alleGut = true, irgendwoFehlt = false, irgendwoZuviel = false;
    step.saetze.forEach(function (tokens, sIdx) {
      var r = bewerte(tokens, sel[sIdx]);
      var buttons = main.querySelectorAll('.tok[data-s="' + sIdx + '"]');
      r.richtig.forEach(function (i) { buttons[i].classList.add("ok"); });
      r.fehlt.forEach(function (i) { buttons[i].classList.add("missing"); });
      r.zuviel.forEach(function (i) { buttons[i].classList.add("extra"); });
      if (!r.gut) alleGut = false;
      if (r.fehlt.length) irgendwoFehlt = true;
      if (r.zuviel.length) irgendwoZuviel = true;

      var info = main.querySelector('[data-info="' + sIdx + '"]');
      if (r.fehlt.length) {
        info.appendChild(h("p", { class: "fehlt", text:
          (r.fehlt.length === 1 ? "Dieses Wort fehlt noch: " : "Diese Wörter fehlen noch: ") +
          r.fehlt.map(function (i) { return reinWort(tokens[i].t); }).join(", ") }));
      }
      if (r.zuviel.length) {
        info.appendChild(h("p", { class: "weg", text:
          (r.zuviel.length === 1 ? "Das Wort kannst du streichen: " : "Diese Wörter kannst du streichen: ") +
          r.zuviel.map(function (i) { return reinWort(tokens[i].t); }).join(", ") }));
      }
    });

    if (alleGut) {
      fb.className = "feedback gut";
      fb.appendChild(h("strong", { text: "Gut gemacht!" }));
      fb.appendChild(document.createTextNode(irgendwoZuviel
        ? "Du hast alle wichtigen Wörter gefunden. Ein paar Wörter kannst du noch streichen. Das ist freiwillig."
        : "Du hast genau die wichtigen Wörter gefunden."));
      if (step.zaehlt) { store.done[step.key] = true; speichern(); }
      setBadge(step);
    } else {
      fb.className = "feedback nochmal";
      if (irgendwoFehlt) {
        fb.appendChild(h("strong", { text: "Du bist nah dran." }));
        fb.appendChild(document.createTextNode("Ein wichtiges Wort fehlt noch. Die eingekreisten Wörter helfen dir. Du kannst es gleich nochmal versuchen."));
      } else {
        fb.appendChild(h("strong", { text: "Fast." }));
        fb.appendChild(document.createTextNode("Das sind etwas viele Marker. Tippe ein paar Wörter nochmal an, um sie wegzunehmen. Dann prüfe nochmal."));
      }
    }
  }

  /* --- Ankreuzfragen --- */

  function renderFrage(step) {
    var f = step.frage;
    var wahl = sess.wahl[step.key];
    var optBtns = [];
    var optionen = h("div", { class: "optionen", role: "group", "aria-label": "Antworten" });
    f.optionen.forEach(function (text, i) {
      var b = h("button", {
        type: "button", class: "opt", "aria-pressed": wahl === i ? "true" : "false", "data-opt": String(i),
        onclick: function () { waehle(step, i); }
      }, [h("span", { class: "kreis" }), h("span", { text: text })]);
      optBtns.push(b);
      optionen.appendChild(b);
    });

    var kids = [kopf("frage", step, step.einheit.fragen.length > 1 || step.text ? "Frage zum Text" : step.einheit.titel,
      step.text ? step.einheit.titel : "Kreuze die richtige Antwort an.")];
    if (step.text) {
      var para = h("p", { class: "textblock" });
      step.text.forEach(function (tokens, i) {
        para.appendChild(document.createTextNode((i ? " " : "") + tokens.map(function (t) { return t.t; }).join(" ")));
      });
      kids.push(h("div", { class: "karte" }, [para]));
    }
    kids.push(h("h2", { class: "frage", text: f.frage }));
    kids.push(optionen);
    var fb = h("div", { class: "feedback", id: "feedback", role: "status", "aria-live": "polite", hidden: true });
    kids.push(h("div", { class: "btnrow" }, [
      h("button", { type: "button", class: "btn btn-marker", id: "pruef-btn", text: "Prüfen", onclick: function () { pruefeFrage(step); } })
    ]));
    kids.push(fb);
    zeige(h("div", null, kids));
  }

  function waehle(step, i) {
    sess.wahl[step.key] = i;
    [].forEach.call(main.querySelectorAll(".opt"), function (b, k) {
      b.setAttribute("aria-pressed", k === i ? "true" : "false");
      b.classList.remove("richtig", "nochmal");
    });
    var fb = $("feedback");
    fb.hidden = true; fb.innerHTML = ""; fb.className = "feedback";
  }

  function pruefeFrage(step) {
    var fb = $("feedback");
    fb.innerHTML = "";
    fb.hidden = false;
    var wahl = sess.wahl[step.key];
    if (wahl === undefined) {
      fb.className = "feedback nochmal";
      fb.appendChild(h("strong", { text: "Tippe zuerst eine Antwort an." }));
      return;
    }
    var btn = main.querySelectorAll(".opt")[wahl];
    if (wahl === step.frage.richtig) {
      btn.classList.add("richtig");
      fb.className = "feedback gut";
      fb.appendChild(h("strong", { text: "Richtig!" }));
      fb.appendChild(document.createTextNode("Gut gelesen."));
      if (step.zaehlt) { store.done[step.key] = true; speichern(); }
      setBadge(step);
    } else {
      btn.classList.add("nochmal");
      fb.className = "feedback nochmal";
      fb.appendChild(h("strong", { text: "Noch nicht ganz." }));
      fb.appendChild(document.createTextNode(step.text
        ? "Lies den Text noch einmal. Suche die Marker-Wörter zur Frage. Dann versuche es nochmal."
        : "Denk noch einmal in Ruhe nach. Dann versuche es nochmal."));
    }
  }

  /* --- Ampel --- */

  function renderAmpel(step) {
    var gewaehlt = store.ampel[step.key] || null;
    var fb = h("div", { class: "feedback", id: "feedback", role: "status", "aria-live": "polite", hidden: true });
    var liste = h("div", { class: "ampel", role: "group", "aria-label": "Ampel" }, D.ampelStufen.map(function (a) {
      return h("button", {
        type: "button", class: "amp", "aria-pressed": gewaehlt === a.id ? "true" : "false", "data-ampel": a.id,
        onclick: function () { waehleAmpel(step, a.id); }
      }, [
        h("span", { class: "punkt", style: "background:" + a.farbe }),
        h("span", null, [h("b", { text: a.wort }), h("span", { class: "s", text: a.text })])
      ]);
    }));
    var wrap = h("div", null, [
      kopf("frage", step, "Wie geht es dir damit?", "Es gibt keine Note. Du schätzt dich selbst ein."),
      h("h2", { class: "frage", text: step.einheit.ampel }),
      liste, fb
    ]);
    zeige(wrap);
    if (gewaehlt) zeigeAmpelFeedback();
  }

  function zeigeAmpelFeedback() {
    var fb = $("feedback");
    fb.hidden = false;
    fb.className = "feedback gut";
    fb.innerHTML = "";
    fb.appendChild(h("strong", { text: "Danke!" }));
    fb.appendChild(document.createTextNode("Ehrlich einschätzen hilft dir beim Lernen."));
  }

  function waehleAmpel(step, id) {
    store.ampel[step.key] = id;
    store.done[step.key] = true;
    speichern();
    [].forEach.call(main.querySelectorAll(".amp"), function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-ampel") === id ? "true" : "false");
    });
    zeigeAmpelFeedback();
  }

  /* ---------- Abschluss ---------- */

  function renderFinish() {
    view = { name: "finish", si: view.si, idx: 0 };
    var stufe = D.stufen[view.si];
    var st = zaehlStand(view.si);
    var satz1 = "Du hast " + st.ok + " von " + st.ges + " " + stufe.einheitName + " geschafft.";
    var satz2;
    if (st.ok === st.ges) satz2 = "Sehr gute Detektivarbeit. Du hast alles gefunden.";
    else if (st.ok >= st.ges / 2) satz2 = "Du bist auf einem guten Weg. Die offenen Aufgaben kannst du dir nochmal ansehen.";
    else satz2 = "Das war ein Anfang. Schau dir die offenen Aufgaben in Ruhe nochmal an.";

    var zeilen = steps[view.si].filter(function (s) { return s.zaehlt; }).map(function (s) {
      var ok = !!store.done[s.key];
      return h("button", {
        type: "button", class: "row" + (ok ? " ok" : ""), "data-key": s.key,
        onclick: function () { gehZu(view.si, steps[view.si].indexOf(s)); }
      }, [h("span", { text: s.name }), h("span", { class: "z", text: ok ? "geschafft" : "noch offen" })]);
    });

    var kids = [
      h("div", { class: "fertig-kopf" }, [
        bild("daumen", "Der Textdetektiv zeigt den Daumen nach oben"),
        h("h1", { text: "Stufe abgeschlossen" }),
        h("p", { class: "lead", id: "auswertung", text: satz1 }),
        h("p", { text: satz2 })
      ]),
      h("div", { class: "liste" }, zeilen)
    ];

    steps[view.si].forEach(function (s) {
      if (s.kind !== "ampel" || !store.ampel[s.key]) return;
      var a = D.ampelStufen.filter(function (x) { return x.id === store.ampel[s.key]; })[0];
      if (!a) return;
      kids.push(h("div", { class: "einschaetzung" }, [
        h("span", { class: "punkt", style: "background:" + a.farbe }),
        h("span", { text: "Deine Einschätzung: " + a.wort + ". " + a.text })
      ]));
    });
    kids.push(h("div", { class: "btnrow" }, [
      h("button", { type: "button", class: "btn btn-marker", id: "zur-auswahl", text: "Zur Auswahl", onclick: renderStart })
    ]));
    zeige(h("div", null, kids));
  }

  /* ---------- Navigation ---------- */

  function zurueck() {
    if (view.name === "step") {
      if (view.idx > 0) gehZu(view.si, view.idx - 1); else renderStart();
    } else if (view.name === "finish") {
      gehZu(view.si, steps[view.si].length - 1);
    }
  }

  function weiter() {
    if (view.name === "step") {
      if (view.idx < steps[view.si].length - 1) gehZu(view.si, view.idx + 1); else renderFinish();
    } else if (view.name === "finish") {
      renderStart();
    }
  }

  /* ---------- Eigener Dialog (kein window.confirm) ---------- */

  var letzterFokus = null;

  function oeffneModal() {
    letzterFokus = document.activeElement;
    $("modal").hidden = false;
    $("modal-cancel").focus();
  }

  function schliesseModal() {
    $("modal").hidden = true;
    if (letzterFokus && letzterFokus.focus) { try { letzterFokus.focus(); } catch (e) { /* egal */ } }
  }

  $("modal-cancel").addEventListener("click", schliesseModal);
  $("modal-ok").addEventListener("click", function () {
    loeschen();
    sess = { sel: {}, streich: {}, wahl: {} };
    $("modal").hidden = true;
    renderStart();
  });
  $("modal").addEventListener("click", function (e) { if (e.target === $("modal")) schliesseModal(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !$("modal").hidden) schliesseModal(); });

  $("back-btn").addEventListener("click", zurueck);
  $("next-btn").addEventListener("click", weiter);
  $("home-btn").addEventListener("click", renderStart);

  /* ---------- Start ---------- */

  laden();
  renderStart();
})();
