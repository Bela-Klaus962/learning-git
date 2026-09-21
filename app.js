/* --------------------------------------------------------------------
   Git cheat sheet — animations
   One GSAP timeline per concept, each drawn on a full-width 1200×480
   stage. Every builder takes its section element, puts the SVG back in
   its starting state, and returns a paused timeline. Timelines start
   the first time their stage scrolls into view, pause when it leaves,
   and can be restarted with the Replay button.

   Rule of thumb for the SVG: anything GSAP moves has NO transform
   attribute of its own. Static positions live on an outer <g>, and the
   inner <g> is the one that animates. (GSAP folds an existing transform
   attribute into its own x/y, which used to fling elements to 0,0.)
-------------------------------------------------------------------- */

(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const $ = (root, sel) => root.querySelector(sel);
  const $$ = (root, sel) => Array.from(root.querySelectorAll(sel));

  const ACCENT = "#b8791e";
  const PALETTE = ["#b8791e", "#2f7d3a", "#6f4bb8", "#2f6b8f"];

  // -----------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------

  // Prep an SVG path for a "draw" effect (animate strokeDashoffset to 0).
  function primePath(el) {
    if (!el || typeof el.getTotalLength !== "function") return 0;
    const len = el.getTotalLength();
    el.style.strokeDasharray = `${len} ${len}`;
    el.style.strokeDashoffset = `${len}`;
    return len;
  }

  function pointAt(pathEl, t) {
    return pathEl.getPointAtLength(t * pathEl.getTotalLength());
  }

  // Tween `target` along an SVG path (x/y are relative to the path's space).
  function follow(target, pathEl, duration, ease = "power1.inOut") {
    const len = pathEl.getTotalLength();
    const p = { t: 0 };
    return gsap.to(p, {
      t: 1,
      duration,
      ease,
      onUpdate: () => {
        const pt = pathEl.getPointAtLength(p.t * len);
        gsap.set(target, { x: pt.x, y: pt.y });
      },
    });
  }

  // Type `text` into an SVG <text> node, with a block cursor while typing.
  function typeInto(el, text, duration = 1.2) {
    const p = { n: 0 };
    return gsap.to(p, {
      n: text.length,
      duration,
      ease: "none",
      onUpdate: () => {
        const n = Math.round(p.n);
        el.textContent = text.slice(0, n) + (n < text.length ? "▍" : "");
      },
    });
  }

  // Cross-fade a caption to new text.
  function say(el, text) {
    const s = gsap.timeline();
    s.to(el, { opacity: 0, duration: 0.18 })
      .call(() => { el.textContent = text; })
      .to(el, { opacity: 1, duration: 0.3 });
    return s;
  }

  // Commit dots: the circle pops, the hash fades in.
  function hideCommits(groups) {
    groups.forEach((g) => {
      gsap.set($(g, "circle"), { scale: 0, transformOrigin: "50% 50%" });
      gsap.set($$(g, "text"), { opacity: 0 });
    });
  }
  function popCommit(g, duration = 0.4) {
    const s = gsap.timeline();
    s.to($(g, "circle"), { scale: 1, duration, ease: "back.out(2.4)" })
      .to($$(g, "text"), { opacity: 1, duration: 0.3 }, 0.1);
    return s;
  }
  function popCommits(groups, stagger = 0.12) {
    const s = gsap.timeline();
    groups.forEach((g, i) => s.add(popCommit(g), i * stagger));
    return s;
  }

  function makeTimeline(reset, repeatDelay = 2) {
    return gsap.timeline({
      paused: true,
      repeat: reduceMotion ? 0 : -1,
      repeatDelay,
      onRepeat: reset,
    });
  }

  // =================================================================
  // BUILDERS
  // =================================================================
  const builders = {};

  // ---------- 1. REPO ----------
  builders.repo = (root) => {
    const folder = $(root, ".repo-folder");
    const files = $$(root, ".repo-file");
    const git = $(root, ".repo-git");
    const link = $(root, ".repo-link");
    const panel = $(root, ".repo-panel");
    const rail = $(root, ".repo-rail");
    const rows = $$(root, ".repo-commit");
    const head = $(root, ".gg-head");

    const reset = () => {
      gsap.set(folder, { opacity: 0, y: 16 });
      gsap.set(files, { opacity: 0, y: 30 });
      gsap.set(git, { opacity: 0, scale: 0.8, transformOrigin: "50% 50%" });
      gsap.set([panel, link], { opacity: 0 });
      gsap.set(rows, { opacity: 0, x: 18 });
      gsap.set(head, { opacity: 0, y: -8 });
      primePath(rail);
    };
    reset();

    const tl = makeTimeline(reset, 2.4);
    tl.to(folder, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, 0)
      .to(panel, { opacity: 1, duration: 0.5 }, 0.2)
      .to(git, { opacity: 1, scale: 1, duration: 0.45, ease: "back.out(2)" }, 0.6)
      .to(link, { opacity: 1, duration: 0.4 }, 1.0)
      .to(rail, { strokeDashoffset: 0, duration: 2.4, ease: "none" }, 1.0);

    files.forEach((f, i) => {
      const t = 1.0 + i * 0.6;
      tl.to(f, { opacity: 1, y: 0, duration: 0.45, ease: "back.out(1.6)" }, t)
        .to(rows[i], { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" }, t + 0.4);
    });

    tl.to(head, { opacity: 1, y: 0, duration: 0.4, ease: "back.out(2)" }, 4.0)
      .to(git, { scale: 1.06, yoyo: true, repeat: 1, duration: 0.25, ease: "power2.inOut" }, 4.2);
    return tl;
  };

  // ---------- 2. CLONE ----------
  builders.clone = (root) => {
    const term = $(root, ".clone-term");
    const cmd = $(root, ".clone-cmd");
    const remote = $(root, ".clone-remote");
    const local = $(root, ".clone-local");
    const path = $(root, "#clonePath");
    const packets = $$(root, ".clone-packet");
    const fileRows = $$(root, ".clone-file");
    const link = $(root, ".clone-link");
    const start = pointAt(path, 0);
    const CMD = "$ git clone git@github.com:you/repo.git";

    const reset = () => {
      gsap.set(term, { opacity: 0, y: -12 });
      gsap.set([remote, local], { opacity: 0, y: 18 });
      gsap.set(path, { opacity: 0 });
      gsap.set(packets, { x: start.x, y: start.y, opacity: 0 });
      gsap.set(fileRows, { opacity: 0, x: -10 });
      gsap.set(link, { opacity: 0, scale: 0.7, transformOrigin: "50% 50%" });
      cmd.textContent = "";
    };
    reset();

    const tl = makeTimeline(reset, 2.2);
    tl.to(term, { opacity: 1, y: 0, duration: 0.4 }, 0)
      .to(remote, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, 0.1)
      .to(local, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, 0.3)
      .add(typeInto(cmd, CMD, 1.6), 0.9)
      .to(path, { opacity: 0.5, duration: 0.4 }, 2.6);

    packets.forEach((packet, i) => {
      const t = 3.0 + i * 0.45;
      tl.set(packet, { opacity: 1 }, t)
        .add(follow(packet, path, 1.3), t)
        .to(packet, { opacity: 0, duration: 0.15 }, t + 1.2)
        .to(fileRows[i], { opacity: 1, x: 0, duration: 0.3, ease: "power2.out" }, t + 1.15);
    });

    tl.to(link, { opacity: 1, scale: 1, duration: 0.45, ease: "back.out(2.2)" }, 6.4);
    return tl;
  };

  // ---------- 3. BRANCH ----------
  builders.branch = (root) => {
    const labels = $$(root, ".gg-label");
    const lane = $(root, ".gg-lane");
    const mainLine = $(root, ".gg-line--main");
    const featLine = $(root, ".gg-line--feat");
    const base = $$(root, ".gg-commits--base .gg-commit");
    const after = $$(root, ".gg-commits--after .gg-commit");
    const feat = $$(root, ".gg-commits--feat .gg-commit");
    const head = $(root, ".gg-head");
    const callout = $(root, ".gg-callout");
    const cmd = $(root, ".gg-callout .viz-cmd");
    const ring = $(root, ".gg-ring");
    const cap = $(root, ".viz-cap");

    const reset = () => {
      gsap.set(labels, { opacity: 0, x: -14 });
      gsap.set(lane, { opacity: 0 });
      primePath(mainLine);
      primePath(featLine);
      hideCommits([...base, ...after, ...feat]);
      gsap.set(head, { opacity: 0, y: -12 });
      gsap.set(callout, { opacity: 0 });
      gsap.set(ring, { opacity: 0, scale: 0.6, transformOrigin: "50% 50%" });
      gsap.set(cap, { opacity: 0 });
      cmd.textContent = "";
    };
    reset();

    const tl = makeTimeline(reset, 2.2);
    tl.to(labels[0], { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" }, 0)
      .to(mainLine, { strokeDashoffset: 0, duration: 1.2, ease: "power1.inOut" }, 0.2)
      .add(popCommits(base, 0.3), 0.7)
      .to(callout, { opacity: 1, duration: 0.3 }, 2.0)
      .add(typeInto(cmd, "$ git switch -c feat/login", 1.3), 2.1)
      .to(ring, { opacity: 1, scale: 1, duration: 0.45, ease: "back.out(2)" }, 2.3)
      .to(labels[1], { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" }, 3.5)
      .to(lane, { opacity: 0.35, duration: 0.4 }, 3.5)
      .to(featLine, { strokeDashoffset: 0, duration: 1.2, ease: "power1.inOut" }, 3.7)
      .to(ring, { opacity: 0, duration: 0.4 }, 4.0)
      .add(popCommits(after, 0.32), 4.2)
      .add(popCommits(feat, 0.32), 4.3)
      .to(head, { opacity: 1, y: 0, duration: 0.45, ease: "back.out(2)" }, 5.5)
      .to(cap, { opacity: 1, duration: 0.5 }, 6.0);
    return tl;
  };

  // ---------- 4. COMMIT ----------
  builders.commit = (root) => {
    const boxes = $$(root, ".cm-box");
    const heads = $$(root, ".cm-head");
    const plain = $$(root, ".cm-file--plain");
    const mover = $(root, ".cm-file--mod");
    const ghost = $(root, ".cm-ghost");
    const mod = $(root, ".cm-mod");
    const slot = $(root, ".cm-slot");
    const slot2 = $(root, ".cm-slot2");
    const arrows = $$(root, ".cm-arrow");
    const old = $$(root, ".cm-commit--old");
    const fresh = $(root, ".cm-commit--new");
    const head = $(root, ".gg-head");
    const cmd = $(root, ".viz-cmd");

    const reset = () => {
      gsap.set([...boxes, ...heads], { opacity: 0 });
      gsap.set(plain, { opacity: 0, y: 14 });
      gsap.set(mover, { opacity: 0, x: 0, y: 14 });
      gsap.set(mod, { scale: 1, transformOrigin: "50% 50%" });
      gsap.set([ghost, slot, slot2, ...arrows], { opacity: 0 });
      gsap.set(old, { opacity: 0, y: 14 });
      gsap.set(fresh, { opacity: 0, scale: 0.88, transformOrigin: "50% 50%" });
      gsap.set(head, { opacity: 0, y: -10 });
      cmd.textContent = "";
    };
    reset();

    const tl = makeTimeline(reset, 2.4);
    tl.to([...boxes, ...heads], { opacity: 1, duration: 0.5, stagger: 0.06 }, 0)
      .to([slot, slot2], { opacity: 1, duration: 0.4 }, 0.5)
      .to([mover, ...plain], { opacity: 1, y: 0, duration: 0.45, stagger: 0.1, ease: "power2.out" }, 0.6)
      .to(old, { opacity: 1, y: 0, duration: 0.45, stagger: 0.15, ease: "power2.out" }, 0.8)
      .to(mod, { scale: 1.5, yoyo: true, repeat: 3, duration: 0.2, ease: "power1.inOut" }, 1.5)
      // git add
      .to(arrows[0], { opacity: 1, duration: 0.3 }, 1.9)
      .add(typeInto(cmd, "$ git add index.html", 1.0), 1.9)
      .to(mover, { x: 400, duration: 0.9, ease: "power2.inOut" }, 3.1)
      .to(ghost, { opacity: 0.3, duration: 0.5 }, 3.1)
      .to(slot, { opacity: 0, duration: 0.4 }, 3.3)
      // git commit
      .call(() => { cmd.textContent = ""; }, null, 4.4)
      .to(arrows[1], { opacity: 1, duration: 0.3 }, 4.4)
      .add(typeInto(cmd, '$ git commit -m "fix hero spacing"', 1.6), 4.5)
      .to(mover, { x: 790, y: -22, duration: 0.9, ease: "power2.inOut" }, 6.3)
      .to(mover, { opacity: 0, duration: 0.25 }, 7.05)
      .to(slot2, { opacity: 0, duration: 0.25 }, 7.0)
      .to(fresh, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.8)" }, 7.0)
      .to(head, { opacity: 1, y: 0, duration: 0.4, ease: "back.out(2)" }, 7.5);
    return tl;
  };

  // ---------- 5. PUSH / PULL ----------
  builders.pushpull = (root) => {
    const boxes = [$(root, ".pp-box-local"), $(root, ".pp-box-remote")];
    const legend = $(root, ".pp-legend");
    const chains = $$(root, ".pp-chain");
    const loc = $$(root, ".pp-local-commits .gg-commit");
    const rem = $$(root, ".pp-remote-commits .gg-commit");
    const ghostLocal = $$(root, ".pp-ghost--local");
    const ghostRemote = $$(root, ".pp-ghost--remote");
    const lanePush = $(root, ".pp-lane--push");
    const lanePull = $(root, ".pp-lane--pull");
    const pushPath = $(root, "#ppPush");
    const pullPath = $(root, "#ppPull");
    const [flyTeam, flyMe1, flyMe2] = $$(root, ".pp-fly");
    const cap = $(root, ".viz-cap");
    const pullStart = pointAt(pullPath, 0);
    const pushStart = pointAt(pushPath, 0);

    const reset = () => {
      gsap.set(boxes, { opacity: 0, y: 14 });
      gsap.set(legend, { opacity: 0 });
      chains.forEach(primePath);
      hideCommits([...loc, ...rem]);
      gsap.set([...ghostLocal, ...ghostRemote], { opacity: 0 });
      gsap.set([lanePush, lanePull], { opacity: 0 });
      gsap.set(flyTeam, { x: pullStart.x, y: pullStart.y, opacity: 0 });
      gsap.set([flyMe1, flyMe2], { x: pushStart.x, y: pushStart.y, opacity: 0 });
      gsap.set(cap, { opacity: 0 });
      cap.textContent = "";
    };
    reset();

    const tl = makeTimeline(reset, 2.4);
    tl.to(boxes, { opacity: 1, y: 0, duration: 0.5, stagger: 0.15, ease: "power2.out" }, 0)
      .to(legend, { opacity: 1, duration: 0.4 }, 0.3)
      .to(chains, { strokeDashoffset: 0, duration: 0.8, ease: "power1.inOut" }, 0.6)
      .add(popCommits(loc.slice(0, 3), 0.12), 1.0)
      .add(popCommits(rem.slice(0, 3), 0.12), 1.0)
      .add(popCommit(rem[3]), 1.6)
      .to([ghostLocal[0], ...ghostRemote], { opacity: 0.4, duration: 0.4 }, 1.8)

      // 1 · pull
      .add(say(cap, "1 · git pull — download your teammate's commit"), 2.3)
      .to(lanePull, { opacity: 1, duration: 0.4 }, 2.4)
      .set(flyTeam, { opacity: 1 }, 3.0)
      .add(follow(flyTeam, pullPath, 1.3), 3.0)
      .to(flyTeam, { opacity: 0, duration: 0.15 }, 4.2)
      .add(popCommit(loc[3]), 4.2)
      .to(ghostLocal[0], { opacity: 0, duration: 0.2 }, 4.2)

      // 2 · commit locally
      .add(say(cap, "2 · commit your own work locally"), 5.2)
      .add(popCommits(loc.slice(4), 0.4), 5.6)

      // 3 · push
      .add(say(cap, "3 · git push — share your commits"), 7.0)
      .to(lanePush, { opacity: 1, duration: 0.4 }, 7.1)
      .set(flyMe1, { opacity: 1 }, 7.6)
      .add(follow(flyMe1, pushPath, 1.3), 7.6)
      .to(flyMe1, { opacity: 0, duration: 0.15 }, 8.8)
      .add(popCommit(rem[4]), 8.8)
      .to(ghostRemote[0], { opacity: 0, duration: 0.2 }, 8.8)
      .set(flyMe2, { opacity: 1 }, 7.95)
      .add(follow(flyMe2, pushPath, 1.3), 7.95)
      .to(flyMe2, { opacity: 0, duration: 0.15 }, 9.15)
      .add(popCommit(rem[5]), 9.15)
      .to(ghostRemote[1], { opacity: 0, duration: 0.2 }, 9.15)

      .add(say(cap, "✓ local and remote are in sync"), 10.0);
    return tl;
  };

  // ---------- 6. FETCH ----------
  builders.fetch = (root) => {
    const remote = $(root, ".fetch-remote");
    const labels = $$(root, ".gg-label");
    const railO = $(root, ".fetch-rail-origin");
    const railM = $(root, ".fetch-rail-main");
    const oc = $$(root, ".fetch-origin-commits .gg-commit");
    const nc = $$(root, ".fetch-new-commits .gg-commit");
    const mc = $$(root, ".fetch-main-commits .gg-commit");
    const head = $(root, ".gg-head");
    const slots = $$(root, ".fetch-slot");
    const routes = $$(root, ".fetch-route");
    const packets = $$(root, ".fetch-packet");
    const behind = $(root, ".fetch-behind");
    const note = $(root, ".fetch-note");
    const cmd = $(root, ".viz-cmd");
    const starts = routes.map((r) => pointAt(r, 0));

    const reset = () => {
      gsap.set(remote, { opacity: 0, y: -14 });
      gsap.set(labels, { opacity: 0, x: -12 });
      primePath(railO);
      primePath(railM);
      hideCommits([...oc, ...nc, ...mc]);
      gsap.set(head, { opacity: 0, y: -10 });
      gsap.set(slots, { opacity: 0 });
      gsap.set(routes, { opacity: 0 });
      packets.forEach((p, i) => gsap.set(p, { x: starts[i].x, y: starts[i].y, opacity: 0 }));
      gsap.set(behind, { opacity: 0, scale: 0.7, transformOrigin: "50% 50%" });
      gsap.set(note, { opacity: 0 });
      cmd.textContent = "";
    };
    reset();

    const tl = makeTimeline(reset, 2.4);
    tl.to(remote, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, 0)
      .to(labels, { opacity: 1, x: 0, duration: 0.4, stagger: 0.15, ease: "power2.out" }, 0.3)
      .to([railO, railM], { strokeDashoffset: 0, duration: 1.0, ease: "power1.inOut" }, 0.5)
      .add(popCommits(oc, 0.12), 0.9)
      .add(popCommits(mc, 0.12), 0.9)
      .to(head, { opacity: 1, y: 0, duration: 0.4, ease: "back.out(2)" }, 1.8)
      .to(slots, { opacity: 0.4, duration: 0.4 }, 1.9)
      .add(typeInto(cmd, "$ git fetch origin", 1.1), 2.5)
      .to(routes, { opacity: 0.5, duration: 0.4 }, 3.6);

    packets.forEach((packet, i) => {
      const t = 3.9 + i * 0.5;
      tl.set(packet, { opacity: 1 }, t)
        .add(follow(packet, routes[i], 1.2, "power1.in"), t)
        .to(packet, { opacity: 0, duration: 0.15 }, t + 1.15)
        .add(popCommit(nc[i]), t + 1.15)
        .to(slots[i], { opacity: 0, duration: 0.2 }, t + 1.15);
    });

    tl.to(behind, { opacity: 1, scale: 1, duration: 0.45, ease: "back.out(2)" }, 6.2)
      .to(note, { opacity: 1, duration: 0.5 }, 6.7);
    return tl;
  };

  // ---------- 7. DIFF ----------
  builders.diff = (root) => {
    const files = $$(root, ".diff-file");
    const lines = $$(root, ".diff-line");
    const dels = $$(root, '.diff-line[data-kind="del"]');
    const hlDel = $$(root, '.diff-line[data-kind="del"] .diff-hl');
    const hlAdd = $$(root, '.diff-line[data-kind="add"] .diff-hl');
    const arrows = $$(root, ".diff-arrow");
    const chips = $$(root, ".diff-chip");

    const reset = () => {
      gsap.set(files, { opacity: 0, y: 14 });
      gsap.set(lines, { opacity: 0, x: 0 });
      gsap.set([...hlDel, ...hlAdd], { opacity: 0, scaleX: 0.02, transformOrigin: "0% 50%" });
      gsap.set(arrows, { opacity: 0 });
      gsap.set(chips, { opacity: 0, y: 10 });
    };
    reset();

    const tl = makeTimeline(reset, 2.4);
    tl.to(files, { opacity: 1, y: 0, duration: 0.5, stagger: 0.15, ease: "power2.out" }, 0)
      .to(lines, { opacity: 1, duration: 0.3, stagger: 0.05 }, 0.5)
      // removed lines light up red and shake
      .to(hlDel, { opacity: 1, scaleX: 1, duration: 0.5, stagger: 0.15, ease: "power2.out" }, 1.6)
      .to(dels, { x: -4, repeat: 5, yoyo: true, duration: 0.06, ease: "power1.inOut" }, 2.3)
      .set(dels, { x: 0 })
      // added lines wipe in green
      .to(hlAdd, { opacity: 1, scaleX: 1, duration: 0.5, stagger: 0.15, ease: "power2.out" }, 2.9)
      .to(arrows, { opacity: 1, duration: 0.3, stagger: 0.12 }, 3.5)
      .to(chips, { opacity: 1, y: 0, duration: 0.4, stagger: 0.15, ease: "back.out(1.8)" }, 4.2);
    return tl;
  };

  // ---------- 8. MERGE ----------
  builders.merge = (root) => {
    const labels = $$(root, ".gg-label");
    const lane = $(root, ".gg-lane");
    const mainLine = $(root, ".gg-line--main:not(.gg-join)");
    const featLine = $(root, ".gg-line--feat:not(.gg-join)");
    const joinMain = $(root, ".gg-join--main");
    const joinFeat = $(root, ".gg-join--feat");
    const main = $$(root, ".gg-commits--main .gg-commit");
    const feat = $$(root, ".gg-commits--feat .gg-commit");
    const mergeG = $(root, ".gg-merge");
    const ripple = $(root, ".gg-ripple");
    const head = $(root, ".gg-head");
    const cmd = $(root, ".viz-cmd");
    const cap = $(root, ".viz-cap");

    const reset = () => {
      gsap.set(labels, { opacity: 0, x: -14 });
      gsap.set(lane, { opacity: 0 });
      [mainLine, featLine, joinMain, joinFeat].forEach(primePath);
      hideCommits([...main, ...feat, mergeG]);
      gsap.set(ripple, { opacity: 0, scale: 1, transformOrigin: "50% 50%" });
      gsap.set(head, { opacity: 0, y: -12 });
      gsap.set(cap, { opacity: 0 });
      cmd.textContent = "";
    };
    reset();

    const tl = makeTimeline(reset, 2.4);
    tl.to(labels[0], { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" }, 0)
      .to(mainLine, { strokeDashoffset: 0, duration: 1.1, ease: "power1.inOut" }, 0.2)
      .add(popCommits(main.slice(0, 2), 0.3), 0.7)
      .to(labels[1], { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" }, 1.6)
      .to(lane, { opacity: 0.35, duration: 0.4 }, 1.6)
      .to(featLine, { strokeDashoffset: 0, duration: 1.2, ease: "power1.inOut" }, 1.8)
      .add(popCommits(feat, 0.3), 2.4)
      .add(popCommits(main.slice(2), 0.35), 2.8)
      // git merge
      .add(typeInto(cmd, "$ git merge feat/login", 1.2), 4.3)
      .to([joinMain, joinFeat], { strokeDashoffset: 0, duration: 0.9, ease: "power1.inOut" }, 5.7)
      .add(popCommit(mergeG, 0.5), 6.4)
      .fromTo(ripple, { opacity: 0.7, scale: 1 }, { opacity: 0, scale: 2.8, duration: 0.9, ease: "power2.out", immediateRender: false }, 6.4)
      .to(head, { opacity: 1, y: 0, duration: 0.45, ease: "back.out(2)" }, 6.7)
      .to(cap, { opacity: 1, duration: 0.5 }, 7.0);
    return tl;
  };

  // ---------- 9. REBASE ----------
  builders.rebase = (root) => {
    const labels = $$(root, ".gg-label");
    const mainLine = $(root, ".gg-line--main");
    const oldLine = $(root, ".rebase-old-line");
    const newLine = $(root, ".rebase-new-line");
    const base = $$(root, ".rebase-base .gg-commit");
    const news = $$(root, ".rebase-new .gg-commit");
    const ghosts = $$(root, ".rebase-ghosts .gg-ghost");
    const movers = $$(root, ".rebase-movers .gg-commit");
    const head = $(root, ".gg-head");
    const cmd = $(root, ".viz-cmd");
    const cap = $(root, ".viz-cap");
    const hashes = movers.map((m) => $(m, ".gg-hash"));
    const OLD = ["f1a", "f2b", "f3c"];
    const NEW = ["x9a", "y8b", "z7c"];

    const reset = () => {
      gsap.set(labels, { opacity: 0, x: -14 });
      [mainLine, oldLine, newLine].forEach(primePath);
      gsap.set(oldLine, { opacity: 1 });
      hideCommits([...base, ...news, ...movers]);
      gsap.set(movers, { x: 0, y: 0 });
      gsap.set(ghosts, { opacity: 0 });
      gsap.set(head, { opacity: 0, x: 0, y: -8 });
      hashes.forEach((h, i) => { h.textContent = OLD[i]; });
      gsap.set(cap, { opacity: 0 });
      cmd.textContent = "";
    };
    reset();

    const tl = makeTimeline(reset, 2.6);
    tl.to(labels, { opacity: 1, x: 0, duration: 0.4, stagger: 0.15, ease: "power2.out" }, 0)
      .to(mainLine, { strokeDashoffset: 0, duration: 1.0, ease: "power1.inOut" }, 0.3)
      .add(popCommits(base, 0.2), 0.7)
      .to(oldLine, { strokeDashoffset: 0, duration: 0.9, ease: "power1.inOut" }, 1.6)
      .add(popCommits(movers, 0.25), 2.0)
      .to(head, { opacity: 1, y: 0, duration: 0.4, ease: "back.out(2)" }, 2.8)
      // main moves on while the branch waits
      .add(popCommits(news, 0.3), 3.6)
      // git rebase main
      .add(typeInto(cmd, "$ git rebase main", 1.1), 4.6)
      // lift off
      .to(ghosts, { opacity: 0.45, duration: 0.3 }, 6.0)
      .to(oldLine, { opacity: 0.3, duration: 0.4 }, 6.0)
      .to(movers, { y: -50, duration: 0.35, stagger: 0.08, ease: "power2.out" }, 6.0)
      .to(head, { y: -50, duration: 0.35, ease: "power2.out" }, 6.16)
      // replay on top of the new main
      .to(newLine, { strokeDashoffset: 0, duration: 1.0, ease: "power1.inOut" }, 6.5)
      .to(movers, { x: 320, duration: 1.0, stagger: 0.1, ease: "power2.inOut" }, 6.6)
      .to(head, { x: 320, duration: 1.0, ease: "power2.inOut" }, 6.8)
      .call(() => { hashes.forEach((h, i) => { h.textContent = NEW[i]; }); }, null, 7.3)
      // touch down
      .to(movers, { y: 0, duration: 0.4, stagger: 0.08, ease: "back.out(1.7)" }, 7.9)
      .to(head, { y: 0, duration: 0.4, ease: "back.out(1.7)" }, 8.1)
      .to(ghosts, { opacity: 0.2, duration: 0.4 }, 8.4)
      .to(cap, { opacity: 1, duration: 0.5 }, 8.7);
    return tl;
  };

  // ---------- 10. MERGE CONFLICT ----------
  builders.conflict = (root) => {
    const panel = $(root, ".cf-panel");
    const lines = $$(root, ".cf-line");
    const slot = $(root, ".cf-slot");
    const markers = $$(root, ".cf-marker");
    const ours = $(root, ".cf-ours");
    const theirs = $(root, ".cf-theirs");
    const resolved = $(root, ".cf-resolved");
    const warn = $(root, ".cf-warn");
    const ok = $(root, ".cf-ok");
    const cap = $(root, ".cf-caption");

    const reset = () => {
      gsap.set(panel, { opacity: 0, y: 14 });
      gsap.set(lines, { opacity: 0 });
      slot.style.stroke = "";
      gsap.set(slot, { opacity: 0 });
      gsap.set(markers, { opacity: 0 });
      gsap.set(ours, { opacity: 0, x: -520, y: 38 });
      gsap.set(theirs, { opacity: 0, x: 520, y: -38 });
      gsap.set(resolved, { opacity: 0 });
      gsap.set([warn, ok], { scale: 0, transformOrigin: "50% 50%" });
      gsap.set(cap, { opacity: 0 });
      cap.textContent = "";
    };
    reset();

    const tl = makeTimeline(reset, 2.6);
    tl.to(panel, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, 0)
      .to(lines, { opacity: 1, duration: 0.35, stagger: 0.12 }, 0.5)
      .to(slot, { opacity: 1, duration: 0.4 }, 1.0)
      .add(say(cap, "main and feat/login both edited the same line…"), 1.3)
      // both edits slide in and collide on the same row
      .to(ours, { opacity: 0.95, x: -30, duration: 0.8, ease: "power3.out" }, 1.9)
      .to(theirs, { opacity: 0.95, x: 30, duration: 0.8, ease: "power3.out" }, 1.9)
      .to(ours, { x: -12, repeat: 5, yoyo: true, duration: 0.07, ease: "power1.inOut" }, 2.9)
      .to(theirs, { x: 12, repeat: 5, yoyo: true, duration: 0.07, ease: "power1.inOut" }, 2.9)
      // they bounce apart; Git flags the conflict
      .to([ours, theirs], { x: 0, y: 0, duration: 0.55, ease: "back.out(1.5)" }, 3.5)
      .to(slot, { stroke: "#b0322f", duration: 0.3 }, 3.6)
      .to(markers, { opacity: 1, duration: 0.3, stagger: 0.1 }, 3.9)
      .to(warn, { scale: 1, duration: 0.45, ease: "back.out(2.5)" }, 4.0)
      .add(say(cap, "CONFLICT — Git can't pick a winner. Keep one, or blend both."), 4.0)
      // a human resolves it
      .to([ours, theirs, ...markers, slot], { opacity: 0, duration: 0.4 }, 6.4)
      .to(warn, { scale: 0, duration: 0.25 }, 6.4)
      .to(resolved, { opacity: 1, duration: 0.45 }, 6.8)
      .to(ok, { scale: 1, duration: 0.45, ease: "back.out(2.5)" }, 6.8)
      .add(say(cap, "Resolved by hand → git add theme.js && git commit"), 6.7);
    return tl;
  };

  // ---------- 11. PULL REQUEST ----------
  builders.pr = (root) => {
    const card = $(root, ".pr-card");
    const badge = $(root, ".pr-badge");
    const badgeText = $(badge, "text");
    const statText = $$(root, ".pr-add, .pr-del, .pr-files");
    const squares = $$(root, ".pr-sq");
    const bubbles = $$(root, ".pr-bubble");
    const heading = $(root, ".pr-heading");
    const checks = $$(root, ".pr-check");
    const button = $(root, ".pr-button");
    const buttonRect = $(button, "rect");
    const buttonText = $(button, "text");
    const burst = $$(root, ".pr-burst");
    const spins = checks.map((c) => $(c, ".pr-spin"));
    const ticks = checks.map((c) => $(c, ".pr-tick"));

    const reset = () => {
      gsap.set(card, { opacity: 0, y: 16 });
      gsap.set(badge, { opacity: 0 });
      badge.setAttribute("data-state", "open");
      badgeText.textContent = "Open";
      gsap.set(statText, { opacity: 0 });
      gsap.set(squares, { scale: 0, transformOrigin: "50% 50%" });
      gsap.set(bubbles, { opacity: 0, y: 14 });
      gsap.set(heading, { opacity: 0 });
      checks.forEach((c) => c.removeAttribute("data-state"));
      gsap.set(checks, { opacity: 0, x: -14 });
      spins.forEach((s) => {
        gsap.set(s, {
          opacity: 0,
          rotation: 0,
          svgOrigin: `${s.getAttribute("cx")} ${s.getAttribute("cy")}`,
        });
      });
      ticks.forEach(primePath);
      button.removeAttribute("data-state");
      buttonText.textContent = "Merge pull request";
      gsap.set(button, { opacity: 0, y: 12, scale: 1, transformOrigin: "50% 50%" });
      burst.forEach((b, i) => gsap.set(b, { x: 0, y: 0, scale: 1, opacity: 0, fill: PALETTE[i % PALETTE.length] }));
    };
    reset();

    const tl = makeTimeline(reset, 2.6);
    tl.to(card, { opacity: 1, y: 0, duration: 0.5, ease: "back.out(1.4)" }, 0)
      .to(badge, { opacity: 1, duration: 0.3 }, 0.4)
      .to(statText, { opacity: 1, duration: 0.3, stagger: 0.1 }, 0.9)
      .to(squares, { scale: 1, duration: 0.3, stagger: 0.07, ease: "back.out(2.2)" }, 1.0)
      .to(bubbles[0], { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" }, 1.5)
      .to(bubbles[1], { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" }, 2.2)
      .to(heading, { opacity: 1, duration: 0.3 }, 3.0);

    // Each check fades in, spins while "running", then turns green.
    checks.forEach((check, i) => {
      const t = 3.2 + i * 1.25;
      tl.to(check, { opacity: 1, x: 0, duration: 0.35, ease: "power2.out" }, t)
        .to(spins[i], { opacity: 1, duration: 0.1 }, t + 0.2)
        .to(spins[i], { rotation: 360, duration: 0.5, repeat: 1, ease: "none" }, t + 0.2)
        .to(spins[i], { opacity: 0, duration: 0.1 }, t + 1.15)
        .call(() => check.setAttribute("data-state", "done"), null, t + 1.15)
        .to(ticks[i], { strokeDashoffset: 0, duration: 0.25, ease: "power1.out" }, t + 1.15);
    });

    tl.to(button, { opacity: 1, y: 0, duration: 0.35 }, 7.3)
      .call(() => button.setAttribute("data-state", "ready"), null, 7.7)
      .to(buttonRect, { scale: 1.04, transformOrigin: "50% 50%", yoyo: true, repeat: 3, duration: 0.2, ease: "power1.inOut" }, 7.7)
      // click → merged
      .to(button, { scale: 0.96, duration: 0.1 }, 8.7)
      .to(button, { scale: 1, duration: 0.25, ease: "back.out(3)" }, 8.8)
      .call(() => {
        button.setAttribute("data-state", "merged");
        buttonText.textContent = "Merged ✓";
        badge.setAttribute("data-state", "merged");
        badgeText.textContent = "Merged";
      }, null, 8.85);

    burst.forEach((b, i) => {
      const a = (i / burst.length) * Math.PI * 2;
      tl.fromTo(
        b,
        { x: 0, y: 0, opacity: 1, scale: 1 },
        { x: Math.cos(a) * 130, y: Math.sin(a) * 70, opacity: 0, scale: 0.3, duration: 0.9, ease: "power2.out", immediateRender: false },
        8.85
      );
    });
    return tl;
  };

  // ---------- 12. ISSUE ----------
  builders.issue = (root) => {
    const card = $(root, ".issue-card");
    const dot = $(root, ".issue-dot");
    const closed = $(root, ".issue-closed");
    const ripple = $(root, ".issue-ripple");
    const status = $(root, ".issue-status");
    const statusText = $(status, "text");
    const body = $$(root, ".issue-body path");
    const side = $(root, ".issue-side");
    const noone = $(root, ".issue-noone");
    const assignee = $(root, ".issue-assignee");
    const labels = $$(root, ".issue-label");
    const pr = $(root, ".issue-pr");
    const events = $$(root, ".issue-event");

    const reset = () => {
      gsap.set(card, { opacity: 0, y: 16 });
      gsap.set([dot, closed], { scale: 0, transformOrigin: "50% 50%" });
      gsap.set(ripple, { opacity: 0, scale: 1, transformOrigin: "50% 50%" });
      gsap.set(status, { opacity: 0 });
      status.setAttribute("data-state", "open");
      statusText.textContent = "Open";
      body.forEach(primePath);
      gsap.set(side, { opacity: 0 });
      gsap.set(noone, { opacity: 1 });
      gsap.set(assignee, { opacity: 0, y: -16 });
      gsap.set(labels, { opacity: 0, scale: 0.6, transformOrigin: "50% 50%" });
      gsap.set(pr, { opacity: 0, x: 40 });
      gsap.set(events, { opacity: 0, x: -10 });
    };
    reset();

    const tl = makeTimeline(reset, 2.6);
    tl.to(card, { opacity: 1, y: 0, duration: 0.5, ease: "back.out(1.4)" }, 0)
      .to(dot, { scale: 1, duration: 0.45, ease: "back.out(2.5)" }, 0.3)
      .to(status, { opacity: 1, duration: 0.3 }, 0.4)
      .to(body, { strokeDashoffset: 0, duration: 0.6, stagger: 0.18, ease: "power1.out" }, 0.9)
      .to(side, { opacity: 1, duration: 0.5 }, 1.8)
      // labels
      .to(labels, { opacity: 1, scale: 1, duration: 0.4, stagger: 0.22, ease: "back.out(2)" }, 2.3)
      .to(events[0], { opacity: 1, x: 0, duration: 0.35 }, 3.0)
      // assignee
      .to(noone, { opacity: 0, duration: 0.2 }, 3.5)
      .to(assignee, { opacity: 1, y: 0, duration: 0.6, ease: "bounce.out" }, 3.6)
      .to(events[1], { opacity: 1, x: 0, duration: 0.35 }, 4.2)
      // linked pull request
      .to(pr, { opacity: 1, x: 0, duration: 0.6, ease: "power3.out" }, 4.8)
      .to(events[2], { opacity: 1, x: 0, duration: 0.35 }, 5.4)
      // merged PR closes the issue
      .to(dot, { scale: 0, duration: 0.2 }, 6.2)
      .to(closed, { scale: 1, duration: 0.5, ease: "back.out(2.5)" }, 6.35)
      .fromTo(ripple, { opacity: 0.7, scale: 1 }, { opacity: 0, scale: 2.6, duration: 0.9, ease: "power2.out", immediateRender: false }, 6.35)
      .call(() => {
        status.setAttribute("data-state", "closed");
        statusText.textContent = "Closed";
      }, null, 6.35)
      .to(events[3], { opacity: 1, x: 0, duration: 0.35 }, 6.6);
    return tl;
  };

  // =================================================================
  // ORCHESTRATION
  // =================================================================
  const sections = $$(document, ".concept[data-anim]");
  const registry = new Map(); // key -> { root, tl, started }

  function build(key) {
    const rec = registry.get(key);
    const builder = builders[key];
    if (!rec || !builder) return null;
    if (rec.tl) rec.tl.kill();
    rec.tl = builder(rec.root);
    return rec.tl;
  }

  function play(key) {
    const tl = build(key);
    if (!tl) return;
    registry.get(key).started = true;
    if (reduceMotion) {
      tl.progress(1).pause();
    } else {
      tl.play(0);
    }
  }

  sections.forEach((section) => {
    const key = section.dataset.anim;
    registry.set(key, { root: section, tl: null, started: false });
    build(key); // apply the hidden/starting state right away

    const replayBtn = $(section, `[data-replay="${key}"]`);
    if (replayBtn) replayBtn.addEventListener("click", () => play(key));
  });

  // Start a scene the first time its stage is in view; pause it when it
  // scrolls away and pick it back up when it returns.
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const key = entry.target.closest(".concept").dataset.anim;
        const rec = registry.get(key);
        if (!rec) return;
        if (entry.isIntersecting) {
          if (!rec.started) play(key);
          else if (!reduceMotion) rec.tl.play();
        } else if (rec.started && !reduceMotion) {
          rec.tl.pause();
        }
      });
    },
    { threshold: 0.3 }
  );
  sections.forEach((s) => io.observe($(s, ".concept__visual")));
})();
