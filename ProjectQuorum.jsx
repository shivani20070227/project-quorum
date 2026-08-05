import React, { useState, useEffect, useRef, useMemo } from "react";

/* ---------- palette ---------- */
const C = {
  bg: "#0D0F1A",
  bg2: "#12162A",
  surface: "#171B30",
  surfaceLine: "#262B47",
  cream: "#F2ECDD",
  creamDim: "#B9B4A6",
  gold: "#E4A63A",
  goldDim: "#8A6A2A",
  love: "#D6534A",
  yes: "#4F9D74",
  no: "#5A6072",
};

/* ---------- film library (fictional titles, no real IP) ---------- */
const GENRES = [
  { name: "Sci-Fi", emoji: "🛰️", from: "#2A3E7A", to: "#1AA6B7" },
  { name: "Thriller", emoji: "🕵️", from: "#3A2E33", to: "#7A2430" },
  { name: "Comedy", emoji: "🎈", from: "#C97A2E", to: "#D94F8C" },
  { name: "Drama", emoji: "🎭", from: "#1F5C57", to: "#374B63" },
  { name: "Horror", emoji: "🕯️", from: "#161320", to: "#4B2A6B" },
  { name: "Romance", emoji: "🌷", from: "#B44B63", to: "#D8A247" },
  { name: "Documentary", emoji: "🎥", from: "#4A5A2E", to: "#6B4A2A" },
  { name: "Animation", emoji: "🎨", from: "#2E7AB4", to: "#8CC24A" },
];

const TITLES = {
  "Sci-Fi": ["Echo Horizon", "The Last Signal", "Quantum Static", "Orbit Nine"],
  "Thriller": ["Glass Corridor", "Midnight Ledger", "The Silent Witness", "Red Wire"],
  "Comedy": ["Parking Lot Wizards", "Aunt Marlene's Wedding", "The Intern From Mars", "Cul-de-Sac Chaos"],
  "Drama": ["Salt and Harbor", "The Cartographer's Son", "Winter Ledger", "Rooftop Gardens"],
  "Horror": ["The House on Vine", "Static Bloom", "Hollow Choir", "The Sleep Debt"],
  "Romance": ["Two Trains to Lisbon", "Paper Lanterns", "The Last Bookstore", "Blue Hour"],
  "Documentary": ["Concrete Rivers", "The Beekeepers", "Signal Lost", "Deep Ice"],
  "Animation": ["Pip and the Paper Moon", "The Tin Forest", "Marmalade Skies", "Nine Lives of Otto"],
};

const FILMS = GENRES.flatMap((g) =>
  TITLES[g.name].map((title, i) => ({
    id: `${g.name}-${i}`,
    title,
    genre: g.name,
    emoji: g.emoji,
    from: g.from,
    to: g.to,
  }))
);

const DEFAULT_NAMES = ["Guest 1", "Guest 2", "Guest 3", "Guest 4", "Guest 5"];

/* ---------- helpers ---------- */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const uid = () => Math.random().toString(36).slice(2, 9);

/* ---------- swipe card ---------- */
function SwipeCard({ film, onVote, interactive, depth }) {
  const [pos, setPos] = useState({ dx: 0, dy: 0 });
  const [dragging, setDragging] = useState(false);
  const [flying, setFlying] = useState(null);
  const startRef = useRef({ x: 0, y: 0, t: 0 });

  function onPointerDown(e) {
    if (!interactive) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    startRef.current = { x: e.clientX, y: e.clientY, t: Date.now() };
  }
  function onPointerMove(e) {
    if (!dragging) return;
    setPos({ dx: e.clientX - startRef.current.x, dy: e.clientY - startRef.current.y });
  }
  function onPointerUp() {
    if (!dragging) return;
    setDragging(false);
    const elapsed = Math.max(1, Date.now() - startRef.current.t);
    const vx = pos.dx / elapsed;
    const vy = pos.dy / elapsed;
    const absDx = Math.abs(pos.dx);
    const absDy = Math.abs(pos.dy);

    let decision = null;
    if (pos.dy < -90 && absDy > absDx * 1.1) decision = "love";
    else if (vy < -0.6 && absDy > absDx) decision = "love";
    else if (absDx > 120) decision = pos.dx > 0 ? "yes" : "no";
    else if (Math.abs(vx) > 0.5 && absDx > absDy) decision = pos.dx > 0 ? "yes" : "no";

    if (decision) {
      setFlying(decision);
      setTimeout(() => onVote(decision), 300);
    } else {
      setPos({ dx: 0, dy: 0 });
    }
  }

  let tx = pos.dx, ty = pos.dy, rot = clamp(pos.dx / 14, -20, 20);
  if (flying === "yes") { tx = 560; ty = pos.dy - 30; rot = 26; }
  if (flying === "no") { tx = -560; ty = pos.dy - 30; rot = -26; }
  if (flying === "love") { tx = pos.dx * 0.2; ty = -720; rot = 0; }

  const stackScale = interactive ? 1 : 1 - depth * 0.045;
  const stackY = interactive ? 0 : depth * 14;

  const transform = interactive
    ? `translate(${tx}px, ${ty}px) rotate(${rot}deg)`
    : `translate(0px, ${stackY}px) scale(${stackScale})`;

  const loveOp = dragging ? clamp((-pos.dy - 15) / 90, 0, 1) : 0;
  const yesOp = dragging && pos.dx > 0 ? clamp(pos.dx / 90, 0, 1) : 0;
  const noOp = dragging && pos.dx < 0 ? clamp(-pos.dx / 90, 0, 1) : 0;

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        position: "absolute",
        inset: 0,
        touchAction: "none",
        cursor: interactive ? (dragging ? "grabbing" : "grab") : "default",
        transform,
        transition: dragging ? "none" : "transform 0.35s cubic-bezier(0.22,0.85,0.3,1)",
        zIndex: interactive ? 10 : 10 - depth,
        userSelect: "none",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 22,
          background: `linear-gradient(155deg, ${film.from}, ${film.to})`,
          border: `1px solid ${C.surfaceLine}`,
          boxShadow: "0 20px 45px rgba(0,0,0,0.45)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: 22,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", top: 18, left: 18, fontSize: 42, opacity: 0.9 }}>{film.emoji}</div>
        <div
          style={{
            position: "absolute", top: 20, right: 20, fontFamily: "Manrope, sans-serif",
            fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase",
            color: "rgba(255,255,255,0.75)", border: "1px solid rgba(255,255,255,0.35)",
            padding: "4px 9px", borderRadius: 999,
          }}
        >
          {film.genre}
        </div>
        <h3
          style={{
            fontFamily: "'Bebas Neue', sans-serif", fontSize: 34, letterSpacing: 0.5,
            color: "#fff", lineHeight: 1.05, textShadow: "0 2px 12px rgba(0,0,0,0.5)",
          }}
        >
          {film.title}
        </h3>

        {interactive && (
          <>
            <Badge label="LOVE" color={C.love} opacity={loveOp} pos={{ top: 22, left: "50%", transform: "translateX(-50%) rotate(0deg)" }} />
            <Badge label="YES" color={C.yes} opacity={yesOp} pos={{ top: 22, left: 22, transform: "rotate(-12deg)" }} />
            <Badge label="NO" color={C.no} opacity={noOp} pos={{ top: 22, right: 22, transform: "rotate(12deg)" }} />
          </>
        )}
      </div>
    </div>
  );
}

function Badge({ label, color, opacity, pos }) {
  return (
    <div
      style={{
        position: "absolute", ...pos, opacity, fontFamily: "'Bebas Neue', sans-serif",
        fontSize: 26, letterSpacing: 2, color, border: `3px solid ${color}`,
        padding: "4px 12px", borderRadius: 8, background: "rgba(13,15,26,0.55)",
      }}
    >
      {label}
    </div>
  );
}

/* ---------- confetti ---------- */
function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 46 }).map(() => ({
        id: uid(),
        left: Math.random() * 100,
        delay: Math.random() * 0.4,
        dur: 1.6 + Math.random() * 1.1,
        rot: Math.random() * 360,
        color: [C.gold, C.love, C.yes, "#fff", "#8CC24A"][Math.floor(Math.random() * 5)],
        size: 6 + Math.random() * 7,
      })),
    []
  );
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {pieces.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute", left: `${p.left}%`, top: -20, width: p.size, height: p.size * 0.4,
            background: p.color, transform: `rotate(${p.rot}deg)`,
            animation: `quorum-fall ${p.dur}s ease-in ${p.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}

/* ---------- main app ---------- */
export default function ProjectQuorum() {
  const [stage, setStage] = useState("setup");
  const [participantCount, setParticipantCount] = useState(3);
  const [names, setNames] = useState(DEFAULT_NAMES);
  const [selectedGenres, setSelectedGenres] = useState([]);

  const [pool, setPool] = useState([]);
  const [sessionFilms, setSessionFilms] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [queues, setQueues] = useState({});
  const [votes, setVotes] = useState({});
  const [activeP, setActiveP] = useState(0);
  const [activeC, setActiveC] = useState(0);
  const [countdown, setCountdown] = useState(5);
  const [round, setRound] = useState(1);

  const filteredLibrary = useMemo(() => {
    if (selectedGenres.length === 0) return FILMS;
    return FILMS.filter((f) => selectedGenres.includes(f.genre));
  }, [selectedGenres]);

  function toggleGenre(g) {
    setSelectedGenres((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
  }

  function buildSession(fromPool) {
    const films = shuffle(fromPool).slice(0, Math.min(15, fromPool.length));
    const ps = names.slice(0, participantCount).map((n, i) => ({ id: `p${i}-${uid()}`, name: n.trim() || `Guest ${i + 1}` }));
    const q = {};
    ps.forEach((p) => (q[p.id] = shuffle(films)));
    setSessionFilms(films);
    setParticipants(ps);
    setQueues(q);
    setVotes({});
    setActiveP(0);
    setActiveC(0);
    return { films, ps };
  }

  function startSession() {
    setPool(filteredLibrary);
    buildSession(filteredLibrary);
    setRound(1);
    setStage("handoff");
  }

  function handleVote(type) {
    const participant = participants[activeP];
    const film = queues[participant.id][activeC];
    const score = type === "love" ? 3 : type === "yes" ? 1 : 0;
    setVotes((prev) => ({
      ...prev,
      [participant.id]: { ...(prev[participant.id] || {}), [film.id]: { type, score } },
    }));
    const nextC = activeC + 1;
    if (nextC >= queues[participant.id].length) {
      if (activeP + 1 >= participants.length) {
        setStage("countdown");
      } else {
        setActiveP(activeP + 1);
        setActiveC(0);
        setStage("handoff");
      }
    } else {
      setActiveC(nextC);
    }
  }

  useEffect(() => {
    if (stage !== "countdown") return;
    setCountdown(5);
    const id = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(id);
          setTimeout(() => setStage("confetti"), 250);
          return 0;
        }
        return c - 1;
      });
    }, 650);
    return () => clearInterval(id);
  }, [stage]);

  useEffect(() => {
    if (stage !== "confetti") return;
    const t = setTimeout(() => setStage("winner"), 1900);
    return () => clearTimeout(t);
  }, [stage]);

  const results = useMemo(() => {
    if (sessionFilms.length === 0) return [];
    return sessionFilms
      .map((film) => {
        let total = 0, loveCount = 0, yesCount = 0, noCount = 0;
        participants.forEach((p) => {
          const v = votes[p.id]?.[film.id];
          if (v) {
            total += v.score;
            if (v.type === "love") loveCount++;
            else if (v.type === "yes") yesCount++;
            else noCount++;
          }
        });
        return { ...film, total, loveCount, yesCount, noCount };
      })
      .sort((a, b) => b.total - a.total || b.loveCount - a.loveCount || b.yesCount - a.yesCount);
  }, [sessionFilms, votes, participants]);

  const winner = results[0];
  const podium = results.slice(0, 3);

  function favoriteGenre(pid) {
    const tally = {};
    sessionFilms.forEach((film) => {
      const v = votes[pid]?.[film.id];
      if (v && v.score > 0) tally[film.genre] = (tally[film.genre] || 0) + v.score;
    });
    let best = null, bestScore = -Infinity;
    Object.entries(tally).forEach(([g, s]) => { if (s > bestScore) { best = g; bestScore = s; } });
    return best;
  }

  function rationaleFor(p) {
    const fav = favoriteGenre(p.id);
    if (!winner) return "";
    if (!fav) return `${p.name} sat this one out with mostly passes.`;
    if (fav === winner.genre) return `${p.name} leans ${fav} — ${winner.title} is a direct hit for them.`;
    const myVote = votes[p.id]?.[winner.id];
    if (myVote?.type === "love") return `${p.name} usually goes for ${fav}, but loved ${winner.title} anyway.`;
    if (myVote?.type === "yes") return `${p.name} leans ${fav}, and still gave ${winner.title} a yes.`;
    return `${p.name} leans ${fav} — ${winner.title} was a stretch for them.`;
  }

  function rematch() {
    const remaining = pool.filter((f) => f.id !== winner.id);
    if (remaining.length < 2) return;
    setPool(remaining);
    buildSession(remaining);
    setRound((r) => r + 1);
    setStage("handoff");
  }

  function newSession() {
    setStage("setup");
    setSessionFilms([]);
    setParticipants([]);
    setVotes({});
    setRound(1);
  }

  const shell = {
    minHeight: "100%",
    background: `radial-gradient(circle at 50% -10%, ${C.bg2}, ${C.bg} 60%)`,
    color: C.cream,
    fontFamily: "Manrope, sans-serif",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "28px 16px 40px",
  };

  return (
    <div style={shell}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Manrope:wght@400;500;600;700;800&display=swap');
        @keyframes quorum-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(520px) rotate(540deg); opacity: 0; }
        }
        @keyframes quorum-pop {
          0% { transform: scale(0.6); opacity: 0; }
          60% { transform: scale(1.06); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes quorum-pulse {
          0%,100% { transform: scale(1); }
          50% { transform: scale(1.12); }
        }
        input::placeholder { color: ${C.creamDim}; }
      `}</style>

      <Header round={round} stage={stage} />

      {stage === "setup" && (
        <Setup
          participantCount={participantCount}
          setParticipantCount={setParticipantCount}
          names={names}
          setNames={setNames}
          selectedGenres={selectedGenres}
          toggleGenre={toggleGenre}
          filteredCount={filteredLibrary.length}
          onStart={startSession}
        />
      )}

      {stage === "handoff" && participants[activeP] && (
        <Handoff
          participant={participants[activeP]}
          index={activeP}
          total={participants.length}
          onReady={() => setStage("voting")}
        />
      )}

      {stage === "voting" && participants[activeP] && (
        <VotingScreen
          participant={participants[activeP]}
          queue={queues[participants[activeP].id]}
          cardIndex={activeC}
          onVote={handleVote}
        />
      )}

      {stage === "countdown" && <CountdownScreen countdown={countdown} />}

      {stage === "confetti" && (
        <div style={{ position: "relative", width: "100%", maxWidth: 420, height: 520 }}>
          <Confetti />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 40, color: C.gold, letterSpacing: 2 }}>
              TALLYING VOTES…
            </div>
          </div>
        </div>
      )}

      {stage === "winner" && winner && (
        <WinnerScreen winner={winner} participants={participants} onNext={() => setStage("matrix")} />
      )}

      {stage === "matrix" && (
        <MatrixScreen results={results} participants={participants} votes={votes} onNext={() => setStage("podium")} />
      )}

      {stage === "podium" && (
        <PodiumScreen
          podium={podium}
          participants={participants}
          rationaleFor={rationaleFor}
          onRematch={rematch}
          onNew={newSession}
          canRematch={pool.length - 1 >= 2}
        />
      )}
    </div>
  );
}

/* ---------- sub screens ---------- */
function Header({ round, stage }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 22 }}>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 30, letterSpacing: 3, color: C.cream }}>
        PROJECT <span style={{ color: C.gold }}>QUORUM</span>
      </div>
      <div style={{ fontSize: 11, letterSpacing: 2, color: C.creamDim, textTransform: "uppercase", marginTop: 2 }}>
        {stage === "setup" ? "Collaborative Film-Voting Session" : `Round ${round}`}
      </div>
    </div>
  );
}

function Setup({ participantCount, setParticipantCount, names, setNames, selectedGenres, toggleGenre, filteredCount, onStart }) {
  return (
    <div style={{ width: "100%", maxWidth: 440 }}>
      <Panel>
        <Label>How many are watching?</Label>
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          {[2, 3, 4, 5].map((n) => (
            <PillButton key={n} active={participantCount === n} onClick={() => setParticipantCount(n)}>
              {n}
            </PillButton>
          ))}
        </div>
      </Panel>

      <Panel>
        <Label>Who's in the crew?</Label>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
          {Array.from({ length: participantCount }).map((_, i) => (
            <input
              key={i}
              value={names[i]}
              placeholder={`Guest ${i + 1}`}
              onChange={(e) => {
                const next = [...names];
                next[i] = e.target.value;
                setNames(next);
              }}
              style={{
                background: C.bg, border: `1px solid ${C.surfaceLine}`, borderRadius: 10,
                padding: "10px 12px", color: C.cream, fontSize: 14, outline: "none",
              }}
            />
          ))}
        </div>
      </Panel>

      <Panel>
        <Label>Pre-filter by genre (optional)</Label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
          {GENRES.map((g) => (
            <PillButton key={g.name} small active={selectedGenres.includes(g.name)} onClick={() => toggleGenre(g.name)}>
              {g.emoji} {g.name}
            </PillButton>
          ))}
        </div>
        <div style={{ fontSize: 12, color: C.creamDim, marginTop: 10 }}>
          {filteredCount} title{filteredCount !== 1 ? "s" : ""} in the pool · queue uses up to 15
        </div>
      </Panel>

      <button
        onClick={onStart}
        style={{
          width: "100%", marginTop: 6, padding: "14px 0", borderRadius: 14, border: "none",
          background: C.gold, color: "#1A1305", fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 20, letterSpacing: 2, cursor: "pointer",
        }}
      >
        START THE QUEUE
      </button>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginTop: 22 }}>
        {["HTML", "CSS", "JavaScript", "React", "CSS Transforms", "Pointer Events API", "State Machine", "Weighted Algorithm", "No external libraries"].map((t) => (
          <span key={t} style={{
            fontSize: 10, letterSpacing: 0.5, color: C.creamDim, border: `1px solid ${C.surfaceLine}`,
            borderRadius: 999, padding: "3px 9px",
          }}>{t}</span>
        ))}
      </div>
    </div>
  );
}

function Handoff({ participant, index, total, onReady }) {
  return (
    <div style={{ width: "100%", maxWidth: 400, textAlign: "center" }}>
      <Panel>
        <div style={{ fontSize: 12, letterSpacing: 2, color: C.creamDim, textTransform: "uppercase" }}>
          Participant {index + 1} of {total}
        </div>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 38, color: C.cream, margin: "10px 0 4px" }}>
          PASS TO {participant.name.toUpperCase()}
        </div>
        <div style={{ color: C.creamDim, fontSize: 13, marginBottom: 18 }}>
          Your 15 cards. Nobody else's swipes affect yours.
        </div>
        <button
          onClick={onReady}
          style={{
            padding: "13px 28px", borderRadius: 14, border: "none", background: C.gold,
            color: "#1A1305", fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 2, cursor: "pointer",
          }}
        >
          I'M READY
        </button>
      </Panel>
    </div>
  );
}

function VotingScreen({ participant, queue, cardIndex, onVote }) {
  const visible = queue.slice(cardIndex, cardIndex + 3);
  return (
    <div style={{ width: "100%", maxWidth: 380, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ fontSize: 12, letterSpacing: 1.5, color: C.creamDim, marginBottom: 4 }}>
        {participant.name}'s queue
      </div>
      <div style={{ display: "flex", gap: 3, marginBottom: 16 }}>
        {queue.map((_, i) => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: 999,
            background: i < cardIndex ? C.gold : i === cardIndex ? C.cream : C.surfaceLine,
          }} />
        ))}
      </div>

      <div style={{ position: "relative", width: 300, height: 420 }}>
        {visible.map((film, i) =>
          i === 0 ? (
            <SwipeCard key={film.id} film={film} interactive depth={i} onVote={onVote} />
          ) : (
            <SwipeCard key={film.id} film={film} interactive={false} depth={i} onVote={() => {}} />
          )
        )}
      </div>

      <div style={{ display: "flex", gap: 20, marginTop: 22 }}>
        <RoundButton color={C.no} label="✕" onClick={() => onVote("no")} />
        <RoundButton color={C.love} label="♥" big onClick={() => onVote("love")} />
        <RoundButton color={C.yes} label="✓" onClick={() => onVote("yes")} />
      </div>
      <div style={{ fontSize: 11, color: C.creamDim, marginTop: 10 }}>
        Swipe left · right · or up for love
      </div>
    </div>
  );
}

function RoundButton({ color, label, onClick, big }) {
  const size = big ? 62 : 52;
  return (
    <button
      onClick={onClick}
      style={{
        width: size, height: size, borderRadius: "50%", border: `2px solid ${color}`,
        background: "rgba(255,255,255,0.02)", color, fontSize: big ? 26 : 20, cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

function CountdownScreen({ countdown }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", height: 420, justifyContent: "center" }}>
      <div style={{ fontSize: 13, letterSpacing: 2, color: C.creamDim, marginBottom: 10, textTransform: "uppercase" }}>
        Every queue is exhausted
      </div>
      <div
        key={countdown}
        style={{
          fontFamily: "'Bebas Neue', sans-serif", fontSize: 120, color: C.gold,
          animation: "quorum-pulse 0.65s ease",
        }}
      >
        {countdown > 0 ? countdown : "•"}
      </div>
    </div>
  );
}

function WinnerScreen({ winner, participants, onNext }) {
  return (
    <div style={{ width: "100%", maxWidth: 340, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ fontSize: 12, letterSpacing: 2, color: C.gold, marginBottom: 12, textTransform: "uppercase" }}>
        Consensus winner
      </div>
      <div style={{ width: 260, height: 360, animation: "quorum-pop 0.55s cubic-bezier(0.22,0.9,0.3,1.2)" }}>
        <div
          style={{
            width: "100%", height: "100%", borderRadius: 22,
            background: `linear-gradient(155deg, ${winner.from}, ${winner.to})`,
            display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 22,
            boxShadow: `0 0 60px ${winner.to}55`,
          }}
        >
          <div style={{ fontSize: 44 }}>{winner.emoji}</div>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 34, color: "#fff", marginTop: 10 }}>
            {winner.title}
          </h2>
          <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 4 }}>
            {winner.genre} · score {winner.total} · {winner.loveCount}♥ {winner.yesCount}✓
          </div>
        </div>
      </div>
      <button onClick={onNext} style={ghostBtn}>SEE THE BREAKDOWN →</button>
    </div>
  );
}

function MatrixScreen({ results, participants, votes, onNext }) {
  const rows = results.slice(0, Math.min(6, results.length));
  const icon = (t) => (t === "love" ? "♥" : t === "yes" ? "✓" : "✕");
  const color = (t) => (t === "love" ? C.love : t === "yes" ? C.yes : C.no);

  return (
    <div style={{ width: "100%", maxWidth: 480 }}>
      <div style={{ fontSize: 12, letterSpacing: 2, color: C.gold, marginBottom: 12, textTransform: "uppercase", textAlign: "center" }}>
        Sentiment breakdown
      </div>
      <Panel>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "4px 8px", color: C.creamDim, fontWeight: 500 }}>Film</th>
                {participants.map((p) => (
                  <th key={p.id} style={{ padding: "4px 8px", color: C.creamDim, fontWeight: 500 }}>{p.name}</th>
                ))}
                <th style={{ padding: "4px 8px", color: C.gold, fontWeight: 600 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((film) => (
                <tr key={film.id} style={{ borderTop: `1px solid ${C.surfaceLine}` }}>
                  <td style={{ padding: "8px", whiteSpace: "nowrap" }}>{film.emoji} {film.title}</td>
                  {participants.map((p) => {
                    const v = votes[p.id]?.[film.id];
                    return (
                      <td key={p.id} style={{ textAlign: "center", color: v ? color(v.type) : C.surfaceLine }}>
                        {v ? icon(v.type) : "–"}
                      </td>
                    );
                  })}
                  <td style={{ textAlign: "center", color: C.gold, fontWeight: 700 }}>{film.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <div style={{ textAlign: "center" }}>
        <button onClick={onNext} style={ghostBtn}>SEE THE PODIUM →</button>
      </div>
    </div>
  );
}

function PodiumScreen({ podium, participants, rationaleFor, onRematch, onNew, canRematch }) {
  const [first, second, third] = podium;
  const block = (film, place, height) =>
    film && (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 100 }}>
        <div style={{ fontSize: 28 }}>{film.emoji}</div>
        <div style={{ fontSize: 11, textAlign: "center", color: C.cream, marginBottom: 6, lineHeight: 1.2 }}>{film.title}</div>
        <div
          style={{
            width: "100%", height, borderRadius: "10px 10px 0 0",
            background: `linear-gradient(155deg, ${film.from}, ${film.to})`,
            display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 8,
            border: `1px solid ${C.surfaceLine}`, borderBottom: "none",
          }}
        >
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, color: "#fff" }}>{place}</span>
        </div>
      </div>
    );

  return (
    <div style={{ width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ fontSize: 12, letterSpacing: 2, color: C.gold, marginBottom: 16, textTransform: "uppercase" }}>
        Podium
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 10, marginBottom: 24 }}>
        {block(second, 2, 90)}
        {block(first, 1, 130)}
        {block(third, 3, 66)}
      </div>

      <Panel>
        <Label>Why this pick</Label>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
          {participants.map((p) => (
            <div key={p.id} style={{ fontSize: 13, color: C.creamDim }}>
              <span style={{ color: C.cream, fontWeight: 600 }}>{p.name}: </span>
              {rationaleFor(p)}
            </div>
          ))}
        </div>
      </Panel>

      <div style={{ display: "flex", gap: 10, width: "100%", marginTop: 6 }}>
        <button
          onClick={onRematch}
          disabled={!canRematch}
          style={{
            flex: 1, padding: "13px 0", borderRadius: 14, border: `2px solid ${C.gold}`,
            background: "transparent", color: canRematch ? C.gold : C.surfaceLine,
            fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, letterSpacing: 1.5,
            cursor: canRematch ? "pointer" : "not-allowed",
          }}
        >
          REMATCH
        </button>
        <button
          onClick={onNew}
          style={{
            flex: 1, padding: "13px 0", borderRadius: 14, border: "none", background: C.gold,
            color: "#1A1305", fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, letterSpacing: 1.5, cursor: "pointer",
          }}
        >
          NEW SESSION
        </button>
      </div>
      {!canRematch && (
        <div style={{ fontSize: 11, color: C.creamDim, marginTop: 8 }}>Not enough titles left in the pool to rematch.</div>
      )}
    </div>
  );
}

/* ---------- ui atoms ---------- */
function Panel({ children }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.surfaceLine}`, borderRadius: 16, padding: 16, marginBottom: 14 }}>
      {children}
    </div>
  );
}
function Label({ children }) {
  return <div style={{ fontSize: 11, letterSpacing: 1.5, color: C.creamDim, textTransform: "uppercase" }}>{children}</div>;
}
function PillButton({ children, active, onClick, small }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: small ? "6px 12px" : "9px 16px", borderRadius: 999,
        border: `1px solid ${active ? C.gold : C.surfaceLine}`,
        background: active ? "rgba(228,166,58,0.15)" : "transparent",
        color: active ? C.gold : C.creamDim, fontSize: small ? 12 : 14, cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}
const ghostBtn = {
  marginTop: 20, padding: "12px 26px", borderRadius: 14, border: "none",
  background: "transparent", color: C.gold, fontFamily: "'Bebas Neue', sans-serif",
  fontSize: 16, letterSpacing: 1.5, cursor: "pointer", textDecoration: "underline",
  textUnderlineOffset: 4,
};
