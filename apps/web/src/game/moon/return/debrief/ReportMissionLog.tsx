import type { WorkshopSession } from "@/game/moon/workshop/lander/workshopSession";
import { missionAssistance } from "@/game/moon/shared/assistance";
import {
  MODEL_BOUNDARIES,
  MISSION_SOURCES,
} from "@/game/moon/shared/missionSources";

/** Keeps the complete flight context available without obscuring the findings. */
export function ReportMissionLog({ session }: { session: WorkshopSession }) {
  const flight = session.moon.returnFlight;
  const assistance = missionAssistance(session);
  const incidents = session.moon.science.hazards.log;
  return (
    <details>
      <summary>Flight notes, assistance & incident history</summary>
      <p>
        {flight.mistakes} corrected return choices.{" "}
        {assistance.length
          ? "Assisted play is recorded below."
          : "No mission assistance is recorded."}{" "}
        {session.moon.science.fieldworkStopped
          ? "Surface work stopped early."
          : ""}
      </p>
      {assistance.length > 0 && (
        <ul>
          {assistance.map((item) => (
            <li key={item}>{item.replaceAll("-", " ")}</li>
          ))}
        </ul>
      )}
      <h4>Surface incident history</h4>
      {incidents.length ? (
        incidents.map((incident) => (
          <article key={incident.id}>
            <h4>
              {incident.kind.replaceAll("-", " ")} · {incident.status}
            </h4>
            <p>{incident.reason}</p>
            <p>
              {incident.actions.length
                ? incident.actions
                    .map((item) => item.action.replaceAll("-", " "))
                    .join(" → ")
                : "No recovery actions recorded."}
            </p>
          </article>
        ))
      ) : (
        <p>No surface incidents were recorded.</p>
      )}
      <h4>Return model and crew account</h4>
      <p>
        Two surface crew rejoin the support specialist in lunar orbit. The rover
        and descent stage stay on the Moon; the empty ascent cabin and service
        module are released during return.
      </p>
      <p>
        Ascent: 10 virtual minutes. Rendezvous: 60 minutes. Earth burn: 3
        minutes. Coast: 3 days. Entry: 10 minutes. Parachutes: 3 minutes. The
        model uses a 600-W cabin load and three crew-days of supplies per day.
        Pausing and playback speed do not add mission time.
      </p>
      <p>
        The fuel model uses the ideal rocket equation with authored maneuver
        allowances: ascent 2,100 m/s, rendezvous 20 m/s and Earth departure
        1,260 m/s. The earlier outward correction is not charged again. Docking
        and entry gates are teaching constraints.
      </p>
      {MODEL_BOUNDARIES.map((item) => (
        <div key={item.title}>
          <h4>{item.title}</h4>
          <p>{item.text}</p>
        </div>
      ))}
      <h4>Mission references</h4>
      <ul>
        {MISSION_SOURCES.filter((source) =>
          [
            "apollo",
            "return",
            "rocket",
            ...(session.moon.objective === "lunar-geology"
              ? ["rocks", "xray"]
              : ["viper", "operations", "water"]),
          ].includes(source.id),
        ).map((source) => (
          <li key={source.id}>
            <a href={source.url} target="_blank" rel="noreferrer">
              {source.title}
            </a>{" "}
            · {source.use}
          </li>
        ))}
      </ul>
    </details>
  );
}
