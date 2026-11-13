(function () {
  var nag = document.getElementById('nag');
  var burger = document.getElementById('burger');
  var menu = document.getElementById('menu');
  var mob = document.getElementById('mob');
  var heroCta = document.getElementById('heroCta');
  var rok = document.getElementById('rok');
  if (rok) rok.textContent = new Date().getFullYear();

  function onScroll() { nag.classList.toggle('pelny', window.scrollY > 40); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  function zamknij() { menu.classList.remove('otw'); nag.classList.remove('menu-otw'); burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Otwórz menu'); }
  burger.addEventListener('click', function () {
    var otw = !menu.classList.contains('otw');
    menu.classList.toggle('otw', otw); nag.classList.toggle('menu-otw', otw);
    burger.setAttribute('aria-expanded', otw ? 'true' : 'false');
    burger.setAttribute('aria-label', otw ? 'Zamknij menu' : 'Otwórz menu');
  });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) zamknij(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') zamknij(); });

  // aktywna pozycja menu = bieżąca sekcja
  var linki = [].slice.call(menu.querySelectorAll('a[href^="#"]'));
  var sekcje = linki.map(function (a) { return document.querySelector(a.getAttribute('href')); });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (wpisy) {
      wpisy.forEach(function (w) {
        if (w.isIntersecting) {
          linki.forEach(function (a) { a.classList.toggle('akt', a.getAttribute('href') === '#' + w.target.id); });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sekcje.forEach(function (s) { if (s) io.observe(s); });
    var hero = document.getElementById('top');
    new IntersectionObserver(function (w) {
      if (w[0].target === hero && w[0].isIntersecting) linki.forEach(function (a) { a.classList.remove('akt'); });
    }, { rootMargin: '-45% 0px -50% 0px' }).observe(hero);

    // dolny pasek na telefonie dopiero po minięciu przycisku z pierwszego ekranu
    new IntersectionObserver(function (w) {
      var widac = !w[0].isIntersecting && w[0].boundingClientRect.top < 0;
      mob.classList.toggle('widac', widac);
      document.body.classList.toggle('mob-on', widac);
    }).observe(heroCta);
  }

  // przeciąganie myszą + strzałki + licznik
  function przeciagaj(tor) {
    var start = null, sx = 0, moved = false;
    tor.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      start = e.clientX; sx = tor.scrollLeft; moved = false;
    });
    window.addEventListener('pointermove', function (e) {
      if (start === null) return;
      var dx = e.clientX - start;
      if (Math.abs(dx) > 4) { moved = true; tor.classList.add('ciag'); }
      tor.scrollLeft = sx - dx;
    });
    window.addEventListener('pointerup', function () {
      if (start === null) return;
      start = null;
      if (!moved) return;
      tor.classList.remove('ciag');
      var krok = tor.firstElementChild ? tor.firstElementChild.getBoundingClientRect().width : tor.clientWidth;
      var gap = parseFloat(getComputedStyle(tor).columnGap) || 0;
      var i = Math.round(tor.scrollLeft / (krok + gap));
      tor.scrollTo({ left: i * (krok + gap), behavior: 'smooth' });
    });
    tor.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
  }

  [].forEach.call(document.querySelectorAll('[data-kar]'), function (k) {
    var tor = k.querySelector('.kar-tor');
    var licz = k.querySelector('.kar-licz b');
    var p = k.querySelector('.kar-p'), n = k.querySelector('.kar-n');
    var ile = tor.children.length;
    function idx() { return Math.round(tor.scrollLeft / Math.max(1, tor.clientWidth)); }
    function odswiez() {
      var i = idx();
      licz.textContent = Math.min(ile, i + 1);
      p.disabled = i <= 0; n.disabled = i >= ile - 1;
    }
    p.addEventListener('click', function () { tor.scrollBy({ left: -tor.clientWidth, behavior: 'smooth' }); });
    n.addEventListener('click', function () { tor.scrollBy({ left: tor.clientWidth, behavior: 'smooth' }); });
    tor.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); n.click(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); p.click(); }
    });
    tor.addEventListener('scroll', function () { window.requestAnimationFrame(odswiez); }, { passive: true });
    przeciagaj(tor);
    odswiez();
  });

  // pas "na terenie ośrodka"
  var pas = document.getElementById('teren');
  if (pas) {
    przeciagaj(pas);
    var bt = document.querySelectorAll('[data-pas]');
    function stan() {
      bt[0].disabled = pas.scrollLeft < 4;
      bt[1].disabled = pas.scrollLeft + pas.clientWidth >= pas.scrollWidth - 4;
    }
    [].forEach.call(bt, function (b) {
      b.addEventListener('click', function () { pas.scrollBy({ left: +b.dataset.pas * pas.clientWidth * 0.75, behavior: 'smooth' }); });
    });
    pas.addEventListener('scroll', function () { window.requestAnimationFrame(stan); }, { passive: true });
    stan();
  }

  // zakładki galerii
  var tabs = [].slice.call(document.querySelectorAll('.gal-tabs [role="tab"]'));
  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      tabs.forEach(function (x) {
        var on = x === t;
        x.setAttribute('aria-selected', on ? 'true' : 'false');
        document.getElementById(x.getAttribute('aria-controls')).hidden = !on;
      });
      var tor = document.getElementById(t.getAttribute('aria-controls')).querySelector('.kar-tor');
      tor.scrollLeft = 0; tor.dispatchEvent(new Event('scroll'));
    });
  });

  // baner zgód: pokazuje się po pierwszym przewinięciu, wybór zapamiętany
  var cookie = document.getElementById('cookie');
  var zapisane = null;
  try { zapisane = localStorage.getItem('zp-zgoda'); } catch (e) {}
  if (!zapisane && cookie) {
    var pokaz = function () { if (window.scrollY > 200) { cookie.hidden = false; window.removeEventListener('scroll', pokaz); } };
    window.addEventListener('scroll', pokaz, { passive: true });
    cookie.addEventListener('click', function (e) {
      var b = e.target.closest('[data-c]');
      if (!b) return;
      try { localStorage.setItem('zp-zgoda', b.dataset.c); } catch (er) {}
      cookie.hidden = true;
    });
  }
})();
