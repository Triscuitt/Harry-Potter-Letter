  /* ============================================================
     STAR FIELD (ambient background)
  ============================================================ */
  (function initStars() {
    const canvas = document.getElementById('stars-canvas');
    const ctx    = canvas.getContext('2d');
    let stars    = [];

    function resize() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function createStars(n) {
      stars = [];
      for (let i = 0; i < n; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: Math.random() * 1.4 + 0.2,
          a: Math.random(),
          speed: Math.random() * 0.003 + 0.001,
          phase: Math.random() * Math.PI * 2
        });
      }
    }

    function drawStars(t) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const s of stars) {
        const alpha = s.a * (0.5 + 0.5 * Math.sin(t * s.speed + s.phase));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,245,210,${alpha})`;
        ctx.fill();
      }
      requestAnimationFrame(drawStars);
    }

    resize();
    createStars(200);
    window.addEventListener('resize', () => { resize(); createStars(200); });
    requestAnimationFrame(drawStars);
  })();


  /* ============================================================
     MAGIC PARTICLES
  ============================================================ */
  (function initMagic() {
    const canvas = document.getElementById('magic-canvas');
    const ctx    = canvas.getContext('2d');
    let particles = [];
    let running   = false;
    let startTime = 0;
    const DURATION = 4000; // ms

    function resize() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    /* Spawn a burst of sparkles from a point */
    function spawnBurst(cx, cy, count) {
      for (let i = 0; i < count; i++) {
        const angle  = Math.random() * Math.PI * 2;
        const speed  = Math.random() * 3 + 0.5;
        const colors = ['#f5d48a','#ffeaa0','#fffbe6','#c49a35','#e8c66a','#ffe59a'];
        particles.push({
          x: cx, y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.5,
          r: Math.random() * 3 + 1,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1,
          decay: Math.random() * 0.018 + 0.008,
          wobble: Math.random() * 0.3,
          wobbleSpeed: Math.random() * 0.08 + 0.04,
          age: 0
        });
      }
    }

    function tick(t) {
      if (!running) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      /* Spawn new particles at random envelope-ish positions */
      if (t - startTime < DURATION * 0.6) {
        const envRect = document.getElementById('envelope').getBoundingClientRect();
        const cx = envRect.left + envRect.width  * (0.2 + Math.random() * 0.6);
        const cy = envRect.top  + envRect.height * (0.2 + Math.random() * 0.6);
        if (Math.random() < 0.4) spawnBurst(cx, cy, 3);
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x     += p.vx + Math.sin(p.age * p.wobbleSpeed) * p.wobble;
        p.y     += p.vy;
        p.vy    += 0.04; // gravity
        p.alpha -= p.decay;
        p.age++;

        if (p.alpha <= 0) { particles.splice(i, 1); continue; }

        /* Draw sparkle cross */
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);

        // Glow
        ctx.shadowBlur  = 8;
        ctx.shadowColor = p.color;

        // Cross arms
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.r * 0.3, -p.r, p.r * 0.6, p.r * 2);
        ctx.fillRect(-p.r, -p.r * 0.3, p.r * 2, p.r * 0.6);

        ctx.restore();
      }

      /* Stop after DURATION */
      if (t - startTime > DURATION && particles.length === 0) {
        running = false;
        canvas.classList.remove('active');
      } else {
        requestAnimationFrame(tick);
      }
    }

    /* Public: start the magic effect */
    window.startMagic = function() {
      running   = true;
      startTime = performance.now();
      canvas.classList.add('active');

      /* Big initial burst from envelope center */
      const envRect = document.getElementById('envelope').getBoundingClientRect();
      spawnBurst(
        envRect.left + envRect.width  / 2,
        envRect.top  + envRect.height / 2,
        60
      );
      requestAnimationFrame(tick);
    };
  })();


  /* ============================================================
     ENVELOPE OPEN SEQUENCE
  ============================================================ */
  const envelope  = document.getElementById('envelope');
  const letterWrap = document.getElementById('letter-wrap');
  const letter    = document.getElementById('letter');
  const openBtn   = document.getElementById('open-btn');
  const resetBtn  = document.getElementById('reset-btn');
  let opened = false;

  openBtn.addEventListener('click', function() {
    if (opened) return;
    opened = true;

    /* 1. Hide button */
    openBtn.classList.add('hidden');

    /* 2. Open envelope flap */
    envelope.classList.add('open');

    /* 3. Start magic particles */
    setTimeout(startMagic, 400);

    /* 4. Slide letter out */
    setTimeout(function() {
      letterWrap.classList.add('sliding');
    }, 700);

    /* 5. After sliding, detach from envelope and show letter fully */
    setTimeout(function() {
      /* Move letter out of envelope into scene for final display */
      letterWrap.classList.remove('sliding');
      letterWrap.style.position  = 'static';
      letterWrap.style.transform = 'none';
      letterWrap.style.width     = '100%';
      letterWrap.style.marginTop = '20px';

      /* Move wrap out of envelope into scene */
      const scene = document.querySelector('.scene');
      const envWrap = document.querySelector('.envelope-wrap');
      scene.insertBefore(letterWrap, envWrap.nextSibling);

      letter.classList.add('revealed');

      /* Show reset */
      resetBtn.classList.add('visible');
    }, 1950);
  });

  /* Reset / close */
  resetBtn.addEventListener('click', function() {
    /* Restore everything to initial state */
    envelope.classList.remove('open');
    letter.classList.remove('revealed');
    letterWrap.classList.remove('sliding');

    /* Move letter-wrap back inside envelope */
    envelope.appendChild(letterWrap);
    letterWrap.style.position  = 'absolute';
    letterWrap.style.transform = '';
    letterWrap.style.width     = '88%';
    letterWrap.style.marginTop = '';
    letterWrap.style.bottom    = '10px';
    letterWrap.style.left      = '50%';
    letterWrap.style.transform = 'translateX(-50%)';

    openBtn.classList.remove('hidden');
    resetBtn.classList.remove('visible');
    opened = false;
  });