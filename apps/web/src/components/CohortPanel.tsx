import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Peer, UseCase } from "../config/useCases";

type PeerState = "pending" | "sealing" | "sealed" | "revealed";

function peerStateAt(
  peer: Peer,
  roundCreatedAt: number | null,
  now: number,
  revealed: boolean,
): PeerState {
  if (revealed) return "revealed";
  if (roundCreatedAt == null) return "pending";
  const elapsed = now - roundCreatedAt;
  if (elapsed < peer.delayMs - 600) return "pending";
  if (elapsed < peer.delayMs) return "sealing";
  return "sealed";
}

interface CohortPanelProps {
  useCase: UseCase;
  roundCreatedAt: number | null;
  revealed: boolean;
  /** user's own committed value (after their commit), used to render the "you" row */
  userCommitted: boolean;
  userValue: number | null;
}

export function CohortPanel({
  useCase,
  roundCreatedAt,
  revealed,
  userCommitted,
  userValue,
}: CohortPanelProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (roundCreatedAt == null || revealed) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [roundCreatedAt, revealed]);

  const peers = useCase.cohort;
  const sealedCount = peers.filter(
    (peer) => peerStateAt(peer, roundCreatedAt, now, revealed) !== "pending",
  ).length;
  const totalCount = peers.length + 1;
  const sealedTotal = sealedCount + (userCommitted ? 1 : 0);

  return (
    <section className="cohort-panel">
      <header className="cohort-head">
        <div>
          <span className="cohort-eyebrow">Sealed cohort</span>
          <h3>Round participants</h3>
          <p>
            Each row is encrypted to Drand R until reveal. Co-bidders are simulated for the
            demo; your commit is real on-chain.
          </p>
        </div>
        <div className="cohort-counter">
          <span>Sealed</span>
          <strong>
            {sealedTotal} / {totalCount}
          </strong>
        </div>
      </header>

      <ul className="cohort-list">
        {/* the user's own row first */}
        <li className={`cohort-row you ${userCommitted ? "sealed" : "pending"} ${revealed ? "revealed" : ""}`}>
          <div className="cohort-name">
            <span className="cohort-dot" aria-hidden="true" />
            <strong>You</strong>
            <small>live · on-chain</small>
          </div>
          <div className="cohort-state">
            <AnimatePresence mode="wait" initial={false}>
              {revealed && userValue != null ? (
                <motion.span
                  key="revealed"
                  className="cohort-value revealed"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {useCase.formatValue(userValue)}
                </motion.span>
              ) : userCommitted ? (
                <motion.span
                  key="sealed"
                  className="cohort-value sealed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  ●●●●●●
                </motion.span>
              ) : (
                <motion.span
                  key="pending"
                  className="cohort-value pending"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  awaiting commit…
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </li>

        {peers.map((peer) => {
          const state = peerStateAt(peer, roundCreatedAt, now, revealed);
          return (
            <li key={peer.name} className={`cohort-row ${state}`}>
              <div className="cohort-name">
                <span className="cohort-dot" aria-hidden="true" />
                <strong>{peer.name}</strong>
                <small>demo cohort</small>
              </div>
              <div className="cohort-state">
                <AnimatePresence mode="wait" initial={false}>
                  {state === "revealed" ? (
                    <motion.span
                      key="revealed"
                      className="cohort-value revealed"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {useCase.formatValue(peer.value)}
                    </motion.span>
                  ) : state === "sealed" ? (
                    <motion.span
                      key="sealed"
                      className="cohort-value sealed"
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ type: "spring", stiffness: 320, damping: 22 }}
                    >
                      ●●●●●●
                    </motion.span>
                  ) : state === "sealing" ? (
                    <motion.span
                      key="sealing"
                      className="cohort-value sealing"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      sealing…
                    </motion.span>
                  ) : (
                    <motion.span
                      key="pending"
                      className="cohort-value pending"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      idle
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
