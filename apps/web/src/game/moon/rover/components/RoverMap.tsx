import {
  ROVER_BASE,
  ROVER_CAMPS,
  visibleRoverSites,
  roverRocks,
  roverHoles,
} from "../rover.ts";
import type { RoverState, RoverSiteId } from "../rover.ts";
export function RoverMap({
  rover,
  selected,
  choose,
}: {
  rover: RoverState;
  selected?: RoverSiteId;
  choose?(id: RoverSiteId): void;
}) {
  const sites = visibleRoverSites(rover),
    camps = ROVER_CAMPS.filter((camp) => camp.id === "base");
  return (
    <svg
      viewBox="-50 -50 100 100"
      role={choose ? "group" : "img"}
      aria-label={
        rover.version >= 3
          ? "Moon map: current objective, base, rocks, craters and your rover"
          : "Moon map: sample sites, lander, sunny camps, rocks, holes and your rover"
      }
    >
      <g
        transform={
          choose ? undefined : `rotate(${(-rover.heading * 180) / Math.PI})`
        }
      >
        <rect x="-49" y="-49" width="98" height="98" rx="3" fill="#625f60" />
        <ellipse cx="27" cy="-24" rx="18" ry="17" fill="#222d40" />
        <path d="M29 14H49V49H29ZM-7-49H49V-27H-7Z" fill="#222d40" />
        {roverRocks(rover).map((rock: any) => (
          <circle
            key={rock.id}
            cx={rock.x}
            cy={rock.z}
            r={rock.radius}
            fill="#a3a1a5"
          />
        ))}
        {roverHoles(rover).map((hole: any) => (
          <circle
            key={hole.id}
            cx={hole.x}
            cy={hole.z}
            r={hole.radius}
            fill="#080e19"
            stroke="#e5a18a"
            strokeWidth=".55"
          />
        ))}
        {camps.map((camp: any) => (
          <g key={camp.id}>
            <circle
              cx={camp.x}
              cy={camp.z}
              r="3.5"
              fill="#88ddbf33"
              stroke="#93ebc7"
              strokeWidth=".55"
            />
            <text
              x={camp.x}
              y={camp.z + 6}
              fontSize="3.1"
              textAnchor="middle"
              fill="#d5ffea"
            >
              {camp.id === "base" ? "BASE" : "CHARGE"}
            </text>
          </g>
        ))}
        {sites.map((site: any) => {
          const collected =
              rover.cargo.includes(site.id) ||
              rover.deposited.includes(site.id),
            failed = site.hard && rover.drilled.includes(site.id);
          return (
            <g
              key={site.id}
              className={choose ? "rover-map-site" : ""}
              role={choose ? "button" : undefined}
              tabIndex={choose ? 0 : undefined}
              aria-label={`${site.id}: ${site.name}${collected ? ", collected" : failed ? ", hard soil" : ""}`}
              onClick={() => choose?.(site.id)}
              onKeyDown={(event) => {
                if (choose && ["Enter", " "].includes(event.key)) {
                  event.preventDefault();
                  choose(site.id);
                }
              }}
            >
              <circle
                cx={site.x}
                cy={site.z}
                r={selected === site.id ? 5 : 4}
                fill={failed ? "#754447" : collected ? "#23594e" : "#513e29"}
                stroke={
                  selected === site.id
                    ? "#fff3ba"
                    : collected
                      ? "#a7f3cd"
                      : "#f2cf86"
                }
                strokeWidth={selected === site.id ? 1.5 : 1}
              />
              <text
                x={site.x}
                y={site.z + 1.3}
                textAnchor="middle"
                fontSize="4"
                fill="#fff9e6"
                fontWeight="bold"
              >
                {failed ? "×" : collected ? "✓" : site.id}
              </text>
            </g>
          );
        })}
        <g
          transform={`translate(${rover.x} ${rover.z}) rotate(${(rover.heading * 180) / Math.PI})`}
        >
          <circle r="5" fill="#8ce2c277" />
          <path
            d="M0-4.8 3.3 3.6 0 2.1-3.3 3.6Z"
            fill="#d5f4ff"
            stroke="#112539"
            strokeWidth=".5"
          />
        </g>
        <text x="-44" y="-42" fontSize="4" fill="#fff6dd">
          N ↑
        </text>
        <circle cx={ROVER_BASE.x} cy={ROVER_BASE.z} r="1.3" fill="#c6ffdd" />
      </g>
    </svg>
  );
}
export function RoverRadar({ rover }: { rover: RoverState }) {
  return (
    <svg
      viewBox="-18 -18 36 36"
      role="img"
      aria-label="Proximity radar: rocks are dots, holes are rings"
    >
      <circle r="17" fill="#0b1926ec" stroke="#8bd4bf77" strokeWidth=".4" />
      <circle r="9" fill="none" stroke="#8bd4bf33" strokeWidth=".3" />
      <path d="M-17 0H17M0-17V17" stroke="#8bd4bf33" strokeWidth=".3" />
      <g transform={`rotate(${(-rover.heading * 180) / Math.PI})`}>
        {[
          ...roverRocks(rover).map((rock: any) => ({ ...rock, hole: false })),
          ...roverHoles(rover).map((hole: any) => ({ ...hole, hole: true })),
        ]
          .filter(
            (item: any) =>
              Math.hypot(item.x - rover.x, item.z - rover.z) - item.radius < 16,
          )
          .map((item: any) => (
            <circle
              key={item.id}
              cx={item.x - rover.x}
              cy={item.z - rover.z}
              r={item.hole ? item.radius : 0.9}
              fill={item.hole ? "#e5a18a22" : "#ffda8a"}
              stroke={item.hole ? "#ffa68f" : "none"}
              strokeWidth=".5"
            />
          ))}
      </g>
      <path d="M0-2 1.5 1.5 0 .8-1.5 1.5Z" fill="#c0ffe7" />
    </svg>
  );
}
