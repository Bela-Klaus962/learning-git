/* --------------------------------------------------------------------
   Git cheat sheet — animations
   One GSAP timeline per concept. Each builder returns a fresh
   timeline so the "Replay" button can rerun it. Timelines start
   the first time a section scrolls into view.
-------------------------------------------------------------------- */

(() => {
  "use strict";

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  // -----------------------------------------------------------------
  // Utility: prep an SVG <path> element for a "draw" effect.
  //   Returns the total length so timelines can animate dashoffset.
  // -----------------------------------------------------------------
  function primePath(el) {
    if (!el || typeof el.getTotalLength !== "function") return 0;
    const len = el.getTotalLength();
    el.style.strokeDasharray = `${len} ${len}`;
    el.style.strokeDashoffset = `${len}`;
    return len;
  }

  // -----------------------------------------------------------------
  // Utility: place a moving element along an SVG <path> via a proxy
  //   tween. Avoids needing MotionPathPlugin.
  // -----------------------------------------------------------------
  function tweenAlongPath(target, pathEl, opts = {}) {
    const total = pathEl.getTotalLength();
    const from = opts.from ?? 0;
    const to = opts.to ?? 1;
    const proxy = { t: from };
    // paused: the timeline that adopts this tween will drive playback.
    return gsap.to(proxy, {
      t: to,
      duration: opts.duration ?? 1.5,
      ease: opts.ease ?? "power1.inOut",
      paused: true,
      onUpdate: () => {
        const p = pathEl.getPointAtLength(proxy.t * total);
        gsap.set(target, { x: p.x, y: p.y });
      },
    });
  }

  // =================================================================
  // BUILDERS
  // Each builder receives the section root element and returns a
  // GSAP timeline. Builders reset the SVG to its initial state on
  // every call so replay is deterministic.
  // =================================================================

  const builders = {};

  // ---------- 1. REPO ----------
  builders.repo = (root) => {
    const folder = root.querySelector(".repo-folder");
    const label = root.querySelector(".repo-label");
    const files = root.querySelectorAll(".repo-file");
    const dots = root.querySelectorAll(".repo-dot");
    const historyLine = root.querySelector(".repo-history line");

    gsap.set(folder, { transformOrigin: "50% 50%", scale: 0.9, opacity: 0 });
    gsap.set(label, { y: -8, opacity: 0 });
    gsap.set(files, { y: 24, opacity: 0 });
    gsap.set(dots, { scale: 0, transformOrigin: "50% 50%" });
    primePath(historyLine);

    const tl = gsap.timeline();
    tl.to(folder, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)" })
      .to(label, { y: 0, opacity: 1, duration: 0.35, ease: "power2.out" }, "-=0.2")
      .to(files, { y: 0, opacity: 1, duration: 0.4, stagger: 0.12, ease: "power2.out" })
      .to(historyLine, { strokeDashoffset: 0, duration: 0.6, ease: "power1.inOut" }, "-=0.2")
      .to(dots, { scale: 1, duration: 0.35, stagger: 0.08, ease: "back.out(2)" }, "-=0.3")
      .to(
        dots[dots.length - 1],
        { scale: 1.25, yoyo: true, repeat: 1, duration: 0.35, ease: "power2.inOut" },
        "+=0.1"
      );
    return tl;
  };

  // ---------- 2. CLONE ----------
  builders.clone = (root) => {
    const remote = root.querySelector(".clone-remote");
    const local = root.querySelector(".clone-local");
    const path = root.querySelector("#clonePath");
    const packets = root.querySelectorAll(".clone-packet");
    const cmd = root.querySelector(".clone-cmd");

    gsap.set(remote, { opacity: 0, y: -10 });
    gsap.set(local, { opacity: 0, y: 10 });
    gsap.set(cmd, { opacity: 0, y: 6 });
    primePath(path);
    gsap.set(packets, { opacity: 0 });

    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.4 });
    tl.to(remote, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" })
      .to(local, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, "-=0.3")
      .to(cmd, { opacity: 1, y: 0, duration: 0.4 }, "-=0.2")
      .to(path, { strokeDashoffset: 0, duration: 0.7, ease: "power1.inOut" }, "-=0.3");

    // Fire packets down the path with staggered starts.
    packets.forEach((packet, i) => {
      tl.add(() => gsap.set(packet, { opacity: 1 }), `+=${i === 0 ? 0.05 : 0.0}`);
      tl.add(
        tweenAlongPath(packet, path, {
          from: 0,
          to: 1,
          duration: 1.4,
          ease: "power1.inOut",
        }),
        `-=${i === 0 ? 0 : 1.1}`
      );
      tl.to(packet, { opacity: 0, duration: 0.2 }, "-=0.15");
    });

    return tl;
  };

  // ---------- 3. BRANCH ----------
  builders.branch = (root) => {
    const mainLine = root.querySelector(".gg-line--main");
    const featLine = root.querySelector(".gg-line--feat");
    const mainCommits = root.querySelectorAll(".gg-commits--main .gg-commit");
    const featCommits = root.querySelectorAll(".gg-commits--feat .gg-commit");
    const labels = root.querySelectorAll(".gg-label");
    const head = root.querySelector(".gg-head");

    primePath(mainLine);
    primePath(featLine);
    gsap.set(mainCommits, { scale: 0, transformOrigin: "50% 50%", opacity: 0 });
    gsap.set(featCommits, { scale: 0, transformOrigin: "50% 50%", opacity: 0 });
    gsap.set(labels, { opacity: 0, x: -10 });
    gsap.set(head, { opacity: 0, y: -6 });

    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.4 });
    tl.to(labels[0], { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" })
      .to(mainLine, { strokeDashoffset: 0, duration: 0.9, ease: "power1.inOut" }, "-=0.2")
      .to(mainCommits, { scale: 1, opacity: 1, stagger: 0.12, duration: 0.35, ease: "back.out(2)" }, "-=0.5")
      .to(labels[1], { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" }, "+=0.1")
      .to(featLine, { strokeDashoffset: 0, duration: 0.9, ease: "power1.inOut" }, "-=0.2")
      .to(featCommits, { scale: 1, opacity: 1, stagger: 0.15, duration: 0.4, ease: "back.out(2)" }, "-=0.5")
      .to(head, { opacity: 1, y: 0, duration: 0.35, ease: "back.out(2)" }, "-=0.1");
    return tl;
  };

  // ---------- 4. COMMIT ----------
  builders.commit = (root) => {
    const cards = root.querySelectorAll(".commit-card");
    gsap.set(cards, { y: 30, opacity: 0 });

    const headRect = cards[cards.length - 1].querySelector("rect");
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.4 });
    tl.to(cards, {
      y: 0,
      opacity: 1,
      duration: 0.55,
      stagger: 0.35,
      ease: "power3.out",
    })
      .to(headRect, { stroke: "#c86b1f", duration: 0.25 }, "-=0.1")
      .to(headRect, { stroke: "#141311", duration: 0.4 });
    return tl;
  };

  // ---------- 5. PUSH / PULL ----------
  builders.pushpull = (root) => {
    const push = root.querySelector(".pp-push");
    const pull = root.querySelector(".pp-pull");
    const packUp = root.querySelector(".pp-packet--up");
    const packDown = root.querySelector(".pp-packet--down");

    gsap.set(root.querySelectorAll(".pp-remote, .pp-local"), { opacity: 0, y: 10 });
    gsap.set([push, pull], { opacity: 0 });
    gsap.set(packUp, { opacity: 0, y: 0 });
    gsap.set(packDown, { opacity: 0, y: 0 });

    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.4 });
    tl.to(root.querySelectorAll(".pp-remote, .pp-local"), {
      opacity: 1,
      y: 0,
      duration: 0.45,
      stagger: 0.15,
      ease: "power2.out",
    })
      .to([push, pull], { opacity: 1, duration: 0.4 }, "-=0.2")
      // push (bottom -> top)
      .set(packUp, { opacity: 1 })
      .to(packUp, { y: -140, duration: 1.1, ease: "power1.inOut" })
      .to(packUp, { opacity: 0, duration: 0.2 }, "-=0.05")
      .set(packUp, { y: 0 })
      // pull (top -> bottom)
      .set(packDown, { opacity: 1 }, "+=0.2")
      .to(packDown, { y: 140, duration: 1.1, ease: "power1.inOut" })
      .to(packDown, { opacity: 0, duration: 0.2 }, "-=0.05")
      .set(packDown, { y: 0 });
    return tl;
  };

  // ---------- 6. FETCH ----------
  builders.fetch = (root) => {
    const remote = root.querySelector(".fetch-remote");
    const path = root.querySelector("#fetchPath");
    const mainLine = root.querySelector(".fetch-main .fetch-line");
    const mainCommits = root.querySelectorAll(".fetch-main .fetch-commit");
    const mainHead = root.querySelector(".fetch-head");
    const originLine = root.querySelector(".fetch-origin .fetch-line");
    const originCommits = root.querySelectorAll(
      ".fetch-origin .fetch-commit:not(.fetch-new)"
    );
    const newCommits = root.querySelectorAll(".fetch-origin .fetch-commit.fetch-new");
    const labels = root.querySelectorAll(".fetch-label");
    const packetA = root.querySelector(".fetch-packet--a");
    const packetB = root.querySelector(".fetch-packet--b");
    const caption = root.querySelector(".fetch-caption");

    gsap.set(remote, { opacity: 0, y: -10 });
    gsap.set(labels, { opacity: 0, x: -8 });
    primePath(mainLine);
    primePath(originLine);
    primePath(path);
    gsap.set(mainCommits, { scale: 0, transformOrigin: "50% 50%", opacity: 0 });
    gsap.set(originCommits, { scale: 0, transformOrigin: "50% 50%", opacity: 0 });
    gsap.set(newCommits, { scale: 0, transformOrigin: "50% 50%", opacity: 0 });
    gsap.set(mainHead, { opacity: 0, y: -6 });
    gsap.set([packetA, packetB], { opacity: 0 });
    gsap.set(caption, { opacity: 0, y: 6 });

    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.8 });

    tl.to(remote, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" })
      .to(labels, { opacity: 1, x: 0, duration: 0.35, stagger: 0.15, ease: "power2.out" }, "-=0.2")
      .to(mainLine, { strokeDashoffset: 0, duration: 0.6, ease: "power1.inOut" }, "-=0.2")
      .to(originLine, { strokeDashoffset: 0, duration: 0.6, ease: "power1.inOut" }, "<")
      .to(mainCommits, { scale: 1, opacity: 1, stagger: 0.08, duration: 0.3, ease: "back.out(2)" }, "-=0.4")
      .to(originCommits, { scale: 1, opacity: 1, stagger: 0.08, duration: 0.3, ease: "back.out(2)" }, "<")
      .to(mainHead, { opacity: 1, y: 0, duration: 0.35, ease: "back.out(2)" }, "-=0.1")
      .to(path, { strokeDashoffset: 0, duration: 0.5, ease: "power1.inOut" }, "+=0.15");

    // Fire two packets down the fetch path, each landing as a new commit.
    const firePacket = (packet, newCommit, delay) => {
      tl.set(packet, { opacity: 1 }, `+=${delay}`)
        .add(
          tweenAlongPath(packet, path, { from: 0, to: 1, duration: 1.0, ease: "power1.in" })
        )
        .to(packet, { opacity: 0, duration: 0.15 }, "-=0.05")
        .to(
          newCommit,
          { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(2.2)" },
          "-=0.2"
        );
    };
    firePacket(packetA, newCommits[0], 0.05);
    firePacket(packetB, newCommits[1], 0.2);

    tl.to(caption, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, "-=0.2");

    return tl;
  };

  // ---------- 7. DIFF ----------
  builders.diff = (root) => {
    const files = root.querySelectorAll(".diff-file");
    const lines = root.querySelectorAll(".diff-line");
    const dels = root.querySelectorAll('.diff-line[data-kind="del"]');
    const adds = root.querySelectorAll('.diff-line[data-kind="add"]');

    gsap.set(files, { opacity: 0, y: 12 });
    gsap.set(lines, { opacity: 0, x: -6 });
    gsap.set(dels, { x: -18 });
    gsap.set(adds, { x: 18 });

    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.8 });
    tl.to(files, { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: "power2.out" })
      .to(lines, {
        opacity: 1,
        x: 0,
        duration: 0.35,
        stagger: 0.06,
        ease: "power2.out",
      }, "-=0.2")
      // "shake" removed lines slightly to draw the eye to them
      .to(
        dels,
        {
          x: -3,
          repeat: 5,
          yoyo: true,
          duration: 0.08,
          ease: "power1.inOut",
        },
        "+=0.2"
      )
      .set(dels, { x: 0 })
      .fromTo(
        adds,
        { scale: 0.96, transformOrigin: "0% 50%" },
        { scale: 1, duration: 0.35, stagger: 0.08, ease: "back.out(1.7)" },
        "-=0.1"
      );
    return tl;
  };

  // ---------- 8. MERGE ----------
  builders.merge = (root) => {
    const mainLine = root.querySelector(".gg-line--main");
    const featLine = root.querySelector(".gg-line--feat");
    const mainCommits = root.querySelectorAll(".gg-commits--main .gg-commit");
    const featCommits = root.querySelectorAll(".gg-commits--feat .gg-commit");
    const mergeGroup = root.querySelector(".gg-merge");
    const labels = root.querySelectorAll(".gg-label");
    const head = root.querySelector(".gg-head");

    primePath(mainLine);
    primePath(featLine);
    gsap.set(mainCommits, { scale: 0, transformOrigin: "50% 50%", opacity: 0 });
    gsap.set(featCommits, { scale: 0, transformOrigin: "50% 50%", opacity: 0 });
    gsap.set(mergeGroup, { scale: 0, transformOrigin: "460px 210px", opacity: 0 });
    gsap.set(labels, { opacity: 0, x: -10 });
    gsap.set(head, { opacity: 0, y: -6 });

    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.6 });
    tl.to(labels, { opacity: 1, x: 0, duration: 0.4, stagger: 0.15, ease: "power2.out" })
      .to(mainLine, { strokeDashoffset: 0, duration: 0.7, ease: "power1.inOut" }, 0.2)
      .to(mainCommits, { scale: 1, opacity: 1, stagger: 0.1, duration: 0.35, ease: "back.out(2)" }, "-=0.4")
      .to(featLine, { strokeDashoffset: 0, duration: 1, ease: "power1.inOut" })
      .to(featCommits, { scale: 1, opacity: 1, stagger: 0.12, duration: 0.35, ease: "back.out(2)" }, "-=0.6")
      .to(mergeGroup, { scale: 1, opacity: 1, duration: 0.45, ease: "back.out(2.5)" }, "+=0.05")
      .to(head, { opacity: 1, y: 0, duration: 0.35, ease: "back.out(2)" }, "-=0.1");
    return tl;
  };

  // ---------- 9. REBASE ----------
  builders.rebase = (root) => {
    const mainLine = root.querySelector(".gg-line--main");
    const allMain = root.querySelectorAll(".rebase-main .gg-commit");
    const originalMain = Array.from(allMain).filter(
      (c) => !c.classList.contains("rebase-new")
    );
    const newMain = root.querySelectorAll(".rebase-main .gg-commit.rebase-new");
    const featCommits = root.querySelectorAll(".rebase-feat .gg-commit");
    const labels = root.querySelectorAll(".gg-label");
    const head = root.querySelector(".rebase-head");

    primePath(mainLine);
    gsap.set(originalMain, { scale: 0, transformOrigin: "50% 50%", opacity: 0 });
    gsap.set(newMain, { scale: 0, transformOrigin: "50% 50%", opacity: 0 });
    gsap.set(featCommits, { scale: 0, transformOrigin: "50% 50%", x: 0, y: 0, opacity: 1 });
    gsap.set(labels, { opacity: 0, x: -10 });
    gsap.set(head, { opacity: 0, x: 0, y: 0 });

    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.6 });

    // Explicit reset at the start of every loop so nothing leaks.
    tl.set(featCommits, { scale: 0, x: 0, y: 0, opacity: 1 })
      .set(head, { opacity: 0, x: 0, y: 0 })
      .set(originalMain, { scale: 0, opacity: 0 })
      .set(newMain, { scale: 0, opacity: 0 })
      .set(labels, { opacity: 0, x: -10 })
      .to(labels, { opacity: 1, x: 0, duration: 0.4, stagger: 0.12, ease: "power2.out" })
      .to(mainLine, { strokeDashoffset: 0, duration: 0.7, ease: "power1.inOut" }, "-=0.1")
      // original main commits pop in
      .to(originalMain, { scale: 1, opacity: 1, stagger: 0.1, duration: 0.35, ease: "back.out(2)" }, "-=0.35")
      // feature commits appear above the old branch point
      .to(featCommits, { scale: 1, stagger: 0.1, duration: 0.35, ease: "back.out(2)" }, "-=0.2")
      .to(head, { opacity: 1, duration: 0.3 }, "-=0.2")
      // main gets new commits while feature waits
      .to(newMain, { scale: 1, opacity: 1, stagger: 0.12, duration: 0.4, ease: "back.out(2)" }, "+=0.25")
      // feature commits + HEAD tag lift, shift right, and land above new HEAD
      .to([featCommits, head], { y: -30, duration: 0.4, ease: "power2.in" }, "+=0.3")
      .to([featCommits, head], { x: 140, duration: 0.7, ease: "power2.inOut" })
      .to([featCommits, head], { y: 0, duration: 0.4, ease: "power2.out" })
      // little settle pulse on the commits (not the head pill)
      .to(featCommits, { scale: 1.15, yoyo: true, repeat: 1, duration: 0.2, stagger: 0.05, ease: "power2.inOut" }, "+=0.1");
    return tl;
  };

  // ---------- 10. MERGE CONFLICT ----------
  builders.conflict = (root) => {
    const file = root.querySelector(".conflict-file");
    const filename = root.querySelector(".conflict-filename");
    const ours = root.querySelector(".conflict-ours");
    const theirs = root.querySelector(".conflict-theirs");
    const warn = root.querySelector(".conflict-warn");
    const caption = root.querySelector(".conflict-caption");

    gsap.set(file, { opacity: 0, y: 12 });
    gsap.set(filename, { opacity: 0 });
    gsap.set(ours, { x: -80, opacity: 0 });
    gsap.set(theirs, { x: 80, opacity: 0 });
    gsap.set(warn, { scale: 0, transformOrigin: "260px 230px" });
    gsap.set(caption, { opacity: 0, y: 6 });

    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.6 });
    tl.to(file, { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" })
      .to(filename, { opacity: 1, duration: 0.3 }, "-=0.2")
      .to(ours, { x: 0, opacity: 1, duration: 0.55, ease: "power2.out" }, "+=0.1")
      .to(theirs, { x: 0, opacity: 1, duration: 0.55, ease: "power2.out" }, "<")
      // collision jitter
      .to([ours, theirs], {
        x: (i) => (i === 0 ? -4 : 4),
        repeat: 5,
        yoyo: true,
        duration: 0.06,
        ease: "power1.inOut",
      }, "+=0.1")
      .set([ours, theirs], { x: 0 })
      .to(warn, { scale: 1, duration: 0.4, ease: "back.out(2.5)" }, "+=0.05")
      .to(warn, { scale: 1.12, yoyo: true, repeat: 3, duration: 0.28, ease: "power1.inOut" })
      .to(caption, { opacity: 1, y: 0, duration: 0.35 }, "-=0.4");
    return tl;
  };

  // ---------- 11. PULL REQUEST ----------
  builders.pr = (root) => {
    const card = root.querySelector(".pr-card > rect");
    const title = root.querySelector(".pr-title");
    const meta = root.querySelector(".pr-meta");
    const checks = root.querySelectorAll(".pr-check");
    const button = root.querySelector(".pr-button");
    const buttonRect = button.querySelector("rect");

    gsap.set(card, { transformOrigin: "50% 50%", scale: 0.95, opacity: 0 });
    gsap.set([title, meta], { opacity: 0, y: 6 });
    gsap.set(checks, { opacity: 0, x: -10 });
    gsap.set(button, { opacity: 0, y: 6 });
    gsap.set(buttonRect, { transformOrigin: "170px 279px" });
    checks.forEach((c) => c.removeAttribute("data-state"));
    button.removeAttribute("data-state");

    const tl = gsap.timeline({
      repeat: -1,
      repeatDelay: 1.6,
      onRepeat: () => {
        checks.forEach((c) => c.removeAttribute("data-state"));
        button.removeAttribute("data-state");
      },
    });

    tl.to(card, { scale: 1, opacity: 1, duration: 0.45, ease: "back.out(1.7)" })
      .to(title, { opacity: 1, y: 0, duration: 0.35 }, "-=0.2")
      .to(meta, { opacity: 1, y: 0, duration: 0.35 }, "-=0.25");

    // Bring in each check, then flip it "done".
    checks.forEach((check, i) => {
      tl.to(check, { opacity: 1, x: 0, duration: 0.35, ease: "power2.out" }, i === 0 ? "+=0.1" : "+=0.15")
        .add(() => check.setAttribute("data-state", "done"), "+=0.05");
    });

    tl.to(button, { opacity: 1, y: 0, duration: 0.35 }, "+=0.15")
      .add(() => button.setAttribute("data-state", "ready"))
      .to(buttonRect, { scale: 1.05, yoyo: true, repeat: 3, duration: 0.22, ease: "power1.inOut" });

    return tl;
  };

  // ---------- 12. ISSUE ----------
  builders.issue = (root) => {
    const card = root.querySelector(".issue-card > rect");
    const dot = root.querySelector(".issue-dot");
    const title = root.querySelector(".issue-title");
    const meta = root.querySelector(".issue-meta");
    const labels = root.querySelectorAll(".issue-label");
    const body = root.querySelectorAll(".issue-body line");
    const assignee = root.querySelector(".issue-assignee");

    gsap.set(card, { transformOrigin: "50% 50%", scale: 0.95, opacity: 0 });
    gsap.set(dot, { scale: 0, transformOrigin: "92px 100px" });
    gsap.set([title, meta], { opacity: 0, y: 6 });
    gsap.set(labels, { opacity: 0, y: 6 });
    gsap.set(body, { scaleX: 0, transformOrigin: "0% 50%" });
    gsap.set(assignee, { opacity: 0, y: -12 });

    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.6 });
    tl.to(card, { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.7)" })
      .to(dot, { scale: 1, duration: 0.35, ease: "back.out(2.5)" }, "-=0.1")
      .to(title, { opacity: 1, y: 0, duration: 0.35 }, "-=0.15")
      .to(meta, { opacity: 1, y: 0, duration: 0.35 }, "-=0.25")
      .to(labels, { opacity: 1, y: 0, duration: 0.35, stagger: 0.12, ease: "back.out(1.7)" })
      .to(body, { scaleX: 1, duration: 0.5, stagger: 0.1, ease: "power2.out" }, "-=0.25")
      .to(assignee, { opacity: 1, y: 0, duration: 0.4, ease: "bounce.out" }, "-=0.5");
    return tl;
  };

  // =================================================================
  // ORCHESTRATION
  // =================================================================

  const sections = document.querySelectorAll(".concept[data-anim]");
  const timelines = new Map(); // key -> {tl, root, started}

  function build(key) {
    const entry = timelines.get(key);
    if (!entry) return null;
    if (entry.tl) entry.tl.kill();
    const builder = builders[key];
    if (!builder) return null;
    const tl = builder(entry.root);
    entry.tl = tl;
    return tl;
  }

  function play(key) {
    const tl = build(key);
    if (!tl) return;
    if (prefersReducedMotion) {
      tl.progress(1).pause();
    } else {
      tl.play(0);
    }
    const entry = timelines.get(key);
    entry.started = true;
  }

  // Register each section, build its timeline immediately (paused) so
  // the initial "hidden" state is applied at load time, and wire up
  // the Replay button.
  sections.forEach((section) => {
    const key = section.dataset.anim;
    timelines.set(key, { root: section, tl: null, started: false });

    const tl = build(key);
    if (tl) tl.pause(0); // hold at frame 0 = hidden/reset state

    const replayBtn = section.querySelector(`[data-replay="${key}"]`);
    if (replayBtn) {
      replayBtn.addEventListener("click", () => play(key));
    }
  });

  // IntersectionObserver kicks each timeline off the first time its
  // section is at least partially in view.
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const section = entry.target;
        const key = section.dataset.anim;
        const rec = timelines.get(key);
        if (!rec || rec.started) return;
        play(key);
      });
    },
    { threshold: 0.25 }
  );
  sections.forEach((s) => io.observe(s));

  // Kick the first section immediately so it isn't blank on load.
  play("repo");
})();
