(function() {
  const W = h.getWidth(), H = h.getHeight();
  const CORAL = { aw: 228, ah: 180, bw: 228, bh: 218 };
  const BUBBLE_LEN = 297, BUBBLE_FRAMES = 27;
  const SEAHORSE_HOP = 5, SEAHORSE_RISE = 16, SEAHORSE_TICKS = 4;
  const SEAHORSE_MOVES = [];

  let IMG = {};
  let fishes = [];
  let bubbleVents = [];
  let seahorse;
  let tick = 0;
  let frameInterval;

  for (let i = 0; i < SEAHORSE_RISE; i++) SEAHORSE_MOVES.push([0, -1]);
  SEAHORSE_MOVES.push([1, 0], [0, 1], [-1, 0], [0, -1], [1, 0]);
  for (let i = 0; i < SEAHORSE_RISE; i++) SEAHORSE_MOVES.push([0, 1]);
  SEAHORSE_MOVES.push([-1, 0]);

  function drawSeek(file, frameLen, idx, x, y) {
    file.seek(idx * frameLen);
    h.drawImage(file.read(frameLen), x, y);
  }

  function openDir(f) {
    if (f.file) f.file.close();
    f.file = E.openFile(f.dir > 0 ? f.pathR : f.pathL, "r");
  }

  function spawnY(vdir, ht) {
    const half = H / 2;
    if (vdir < 0) return half + Math.randInt(half - 10 - ht);
    if (vdir > 0) return 10 + Math.randInt(half - 10 - ht);
    return 10 + Math.randInt(H - 20 - ht);
  }

  function makeFish(pathL, pathR, frameLen, frameCount, w, ht, minSpd, maxSpd, animEvery, vdir) {
    const dir = Math.randInt(2) ? 1 : -1;
    const f = {
      pathL: pathL, pathR: pathR, frameLen: frameLen, frameCount: frameCount,
      w: w, h: ht, minSpd: minSpd, maxSpd: maxSpd, animEvery: animEvery, vdir: vdir,
      dir: dir,
      x: dir > 0 ? -w : W,
      y: spawnY(vdir, ht),
      spd: minSpd + Math.randInt(maxSpd - minSpd + 1),
      frame: 0, anim: 0, file: undefined
    };
    openDir(f);
    return f;
  }

  function respawnFish(f) {
    const newDir = Math.randInt(2) ? 1 : -1;
    if (newDir !== f.dir) { f.dir = newDir; openDir(f); }
    f.x = f.dir > 0 ? -f.w : W;
    f.y = spawnY(f.vdir, f.h);
    f.spd = f.minSpd + Math.randInt(f.maxSpd - f.minSpd + 1);
  }

  function stepSeahorse() {
    if (seahorse.phase < 0) {
      seahorse.waitTimer--;
      if (seahorse.waitTimer <= 0) { seahorse.phase = 0; seahorse.stepTicks = 0; }
      return;
    }
    const mv = SEAHORSE_MOVES[seahorse.phase];
    const step = seahorse.stepTicks === SEAHORSE_TICKS - 1 ? SEAHORSE_HOP - (SEAHORSE_TICKS - 1) : 1;
    seahorse.x += mv[0] * step;
    seahorse.y += mv[1] * step;
    seahorse.stepTicks++;
    if (seahorse.stepTicks >= SEAHORSE_TICKS) {
      seahorse.stepTicks = 0;
      seahorse.phase++;
      if (seahorse.phase >= SEAHORSE_MOVES.length) {
        seahorse.phase = -1;
        seahorse.x = seahorse.homeX;
        seahorse.y = seahorse.homeY + SEAHORSE_HOP * SEAHORSE_RISE;
        seahorse.waitTimer = 50 + Math.randInt(200);
      }
    }
  }

  function onFrame() { "ram";
    tick++;
    h.clear(0);

    stepSeahorse();
    seahorse.anim++;
    if (seahorse.anim >= 2) { seahorse.anim = 0; seahorse.frame = (seahorse.frame + 1) % seahorse.frameCount; }
    drawSeek(seahorse.file, seahorse.frameLen, seahorse.frame, seahorse.x, seahorse.y);

    h.drawImage(IMG.coralA, W - CORAL.aw, H - CORAL.ah);
    h.drawImage(IMG.coralB, 0, H - CORAL.bh);

    for (let i = 0; i < fishes.length; i++) {
      const f = fishes[i];
      f.x += f.dir * f.spd;
      f.y = E.clip(f.y + f.vdir, 10, H - 20 - f.h);
      if ((f.dir > 0 && f.x > W) || (f.dir < 0 && f.x + f.w < 0)) respawnFish(f);
      f.anim++;
      if (f.anim >= f.animEvery) { f.anim = 0; f.frame = (f.frame + 1) % f.frameCount; }
      drawSeek(f.file, f.frameLen, f.frame, f.x, f.y);
    }

    for (let i = 0; i < bubbleVents.length; i++) {
      const v = bubbleVents[i];
      v.anim++;
      if (v.anim >= 2) { v.anim = 0; v.frame = (v.frame + 1) % BUBBLE_FRAMES; }
      drawSeek(IMG.bubbleFile, BUBBLE_LEN, v.frame, v.x, v.y);
    }
  }

  h.clear(0);
  //Pip.audioStart("HOLO/PIPQUARIUM/AMBIENT.WAV", { repeat: true });

  setTimeout(function() {
    E.defrag();
    IMG.coralA = fs.readFileSync("HOLO/PIPQUARIUM/CORAL_A.IMG");
    IMG.coralB = fs.readFileSync("HOLO/PIPQUARIUM/CORAL_B.IMG");
    IMG.bubbleFile = E.openFile("HOLO/PIPQUARIUM/BUBBLE.IMG", "r");

    fishes.push(makeFish("HOLO/PIPQUARIUM/FISHA_R.IMG", "HOLO/PIPQUARIUM/FISHA_L.IMG", 1083, 10, 83, 52, 4, 6, 1, 1));
    fishes.push(makeFish("HOLO/PIPQUARIUM/FISHB_R.IMG", "HOLO/PIPQUARIUM/FISHB_L.IMG", 928, 6, 77, 48, 4, 7, 1, -1));
    fishes.push(makeFish("HOLO/PIPQUARIUM/TRIG_R.IMG", "HOLO/PIPQUARIUM/TRIG_L.IMG", 1829, 6, 100, 73, 2, 4, 1, 1));
    fishes.push(makeFish("HOLO/PIPQUARIUM/RAY_L.IMG", "HOLO/PIPQUARIUM/RAY_R.IMG", 2036, 10, 127, 64, 4, 6, 1, 0));

    seahorse = {
      file: E.openFile("HOLO/PIPQUARIUM/SEAHORSE.IMG", "r"), frameLen: 785, frameCount: 3,
      homeX: 300, homeY: 200,
      x: 300, y: 200 + SEAHORSE_HOP * SEAHORSE_RISE,
      phase: -1, stepTicks: 0, waitTimer: /*30 + Math.randInt(150)*/ 10,
      frame: 0, anim: 0
    };

    bubbleVents.push({ x: 40, y: 60, frame: 0, anim: 0 });
    bubbleVents.push({ x: 110, y: 180, frame: 7, anim: 0 });
    bubbleVents.push({ x: 160, y: 200, frame: 14, anim: 0 });
    bubbleVents.push({ x: 430, y: 130, frame: 21, anim: 0 });

    frameInterval = setInterval(onFrame, 100);
  }, 0);

  return {
    id: "PIPQUARIUM",
    notDefault: true,
    fullscreen: true,
    remove: function() {
      if (frameInterval) clearInterval(frameInterval);
      for (let i = 0; i < fishes.length; i++) if (fishes[i].file) fishes[i].file.close();
      if (seahorse && seahorse.file) seahorse.file.close();
      if (IMG.bubbleFile) IMG.bubbleFile.close();
      Pip.audioStop();
      h.clear();
    }
  };
});
