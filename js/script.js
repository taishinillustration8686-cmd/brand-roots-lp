/* ==========================================================================
   BRAND ROOTS 個別相談 LP
   ① スクロールリビール ② ナビの縮小 ③ SP追従CTAの出し入れ ④ ドロワー自動クローズ
   ========================================================================== */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- ① スクロールリビール ---------- */
  var targets = document.querySelectorAll('.reveal');

  if (reduce || !('IntersectionObserver' in window)) {
    // 動きを抑える設定の場合、または非対応ブラウザでは最初から表示する
    Array.prototype.forEach.call(targets, function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);   // 一度出したら監視をやめる
        }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    Array.prototype.forEach.call(targets, function (el) { io.observe(el); });
  }

  /* ---------- ② ナビの縮小 ＋ ③ 追従CTA ---------- */
  var nav = document.getElementById('nav');
  var sticky = document.querySelector('.sticky-cta');
  var hero = document.querySelector('.hero');
  var applySec = document.getElementById('apply');
  var ticking = false;

  function onScroll() {
    var y = window.pageYOffset || document.documentElement.scrollTop;

    if (nav) nav.classList.toggle('scrolled', y > 40);

    if (sticky && hero && applySec) {
      // ヒーローを抜けてから、申込みセクションに入る手前までだけ出す
      var afterHero = y > hero.offsetHeight * 0.85;
      var beforeApply = y + window.innerHeight < applySec.offsetTop + 120;
      sticky.classList.toggle('show', afterHero && beforeApply);
    }
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  /* ---------- ④ 申込みフォーム ---------- */
  var form = document.getElementById('applyForm');

  if (form) {
    var errBox = document.getElementById('formError');
    var btn    = document.getElementById('formSubmit');
    var done   = document.getElementById('formDone');
    var card   = document.querySelector('.form-card');

    function clearErr(el) {
      el.classList.remove('err');
      var wrap = el.closest('.f-radio, .f-agree');
      if (wrap) wrap.classList.remove('err');
    }

    // 入力し直したらエラー表示を消す
    form.addEventListener('input', function (e) { clearErr(e.target); });
    form.addEventListener('change', function (e) { clearErr(e.target); });

    // 必須項目をチェックし、最初の未入力欄を返す
    function findFirstInvalid() {
      var required = form.querySelectorAll('[required]');
      for (var i = 0; i < required.length; i++) {
        var el = required[i];
        var ok;
        if (el.type === 'radio') {
          ok = !!form.querySelector('input[name="' + el.name + '"]:checked');
        } else if (el.type === 'checkbox') {
          ok = el.checked;
        } else if (el.type === 'email') {
          ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim());
        } else {
          ok = el.value.trim() !== '';
        }
        if (!ok) return el;
      }
      return null;
    }

    form.addEventListener('submit', function (e) {
      var bad = findFirstInvalid();

      if (bad) {
        e.preventDefault();
        bad.classList.add('err');
        var wrap = bad.closest('.f-radio, .f-agree');
        if (wrap) wrap.classList.add('err');

        errBox.textContent = (bad.type === 'email' && bad.value.trim() !== '')
          ? 'メールアドレスの形式をご確認ください。'
          : '未入力の必須項目があります。ご確認ください。';
        errBox.hidden = false;

        (wrap || bad).scrollIntoView({ block: 'center', behavior: reduceMotion() ? 'auto' : 'smooth' });
        if (bad.focus) bad.focus({ preventScroll: true });
        return;
      }

      errBox.hidden = true;

      // fetch が使えない環境では通常のPOSTに任せる
      if (!window.fetch || !window.FormData) return;

      e.preventDefault();
      btn.disabled = true;
      btn.textContent = '送信しています…';

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      })
      .then(function (res) {
        if (!res.ok) throw new Error('status ' + res.status);
        // 完了メッセージに差し替える
        form.hidden = true;
        done.hidden = false;
        if (card) card.scrollIntoView({ block: 'center', behavior: reduceMotion() ? 'auto' : 'smooth' });
      })
      .catch(function () {
        btn.disabled = false;
        btn.textContent = '無料で個別相談を申し込む';
        // innerHTMLは使わず、要素を組み立てる
        var mail = 'taishinillustration8686@gmail.com';
        var link = document.createElement('a');
        link.href = 'mailto:' + mail;
        link.textContent = mail;
        errBox.textContent = '送信できませんでした。お手数ですが、';
        errBox.appendChild(link);
        errBox.appendChild(document.createTextNode(' まで直接ご連絡ください。'));
        errBox.hidden = false;
      });
    });

    function reduceMotion() {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
  }

  /* ---------- ⑤ ドロワーを閉じる ---------- */
  var toggle = document.getElementById('navToggle');
  if (toggle) {
    document.querySelectorAll('.nav-links a').forEach(function (a) {
      a.addEventListener('click', function () { toggle.checked = false; });
    });
  }
})();
