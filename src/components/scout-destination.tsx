import { useState } from "react";
import { ZONES } from "@/lib/family";
import { useGuardian } from "@/lib/store";

function mapsLinks(query: string) {
  const dest = encodeURIComponent(query);
  return {
    google: `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`,
    apple: `https://maps.apple.com/?daddr=${dest}&dirflg=d`,
  };
}

type Band = "Free" | "$" | "$$";

const OFFERS: {
  id: string;
  name: string;
  band: Band;
  where: string;
  fact: string;
  source: string;
}[] = [
  {
    id: "kings-park",
    name: "Kings Park playgrounds",
    band: "Free",
    where: "Kings Park, Perth",
    fact: "Playgrounds and the botanic garden. No entry fee.",
    source: "https://www.bgpa.wa.gov.au/kings-park",
  },
  {
    id: "elizabeth-quay",
    name: "Elizabeth Quay",
    band: "Free",
    where: "Elizabeth Quay, Perth",
    fact: "The waterfront and the playground. Walk in.",
    source: "https://www.mra.wa.gov.au/see-and-do/elizabeth-quay",
  },
  {
    id: "agwa",
    name: "Art Gallery of WA",
    band: "Free",
    where: "Art Gallery of Western Australia, Perth",
    fact: "General admission is free. Exhibitions can differ.",
    source: "https://artgallery.wa.gov.au/",
  },
  {
    id: "museum",
    name: "WA Museum Boola Bardip",
    band: "$",
    where: "WA Museum Boola Bardip, Perth",
    fact: "Family galleries in the Cultural Centre. Price is on the listing.",
    source: "https://visit.museum.wa.gov.au/boolabardip/family",
  },
  {
    id: "scitech",
    name: "Scitech",
    band: "$",
    where: "Scitech, Perth",
    fact: "Hands-on science for a few hours. Ticketed.",
    source: "https://www.scitech.org.au/",
  },
  {
    id: "zoo",
    name: "Perth Zoo",
    band: "$$",
    where: "Perth Zoo, South Perth",
    fact: "A paid day out. Tickets are on the zoo site.",
    source: "https://perthzoo.wa.gov.au/",
  },
  {
    id: "aqwa",
    name: "AQWA",
    band: "$$",
    where: "AQWA, Hillarys",
    fact: "The aquarium at Hillarys. A bigger ticket than the park.",
    source: "https://www.aqwa.com.au/",
  },
];

const BANDS: ("All" | Band)[] = ["All", "Free", "$", "$$"];

export function ScoutDestination() {
  const logScout = useGuardian((s) => s.logScout);
  const logs = useGuardian((s) => s.scoutLogs) ?? [];
  const [place, setPlace] = useState("School");
  const [band, setBand] = useState<(typeof BANDS)[number]>("All");
  const [picked, setPicked] = useState<string | null>(null);
  const query = place.toLowerCase().includes("perth") ? place : `${place}, Perth WA`;
  const links = mapsLinks(query);
  const latest = logs[0];
  const shown = OFFERS.filter((offer) => band === "All" || offer.band === band);

  return (
    <>
      <section className="mt-4 rounded-[24px] bg-panel p-4 shadow-[var(--shadow-border)]">
        <p className="text-sm font-semibold">Something to do</p>
        <p className="mt-1 text-xs text-muted">This weekend in Perth. Free, a ticket, or a bigger day. Scout does not take the booking.</p>
        <div className="mt-3 flex gap-1.5">
          {BANDS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setBand(item)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${band === item ? "bg-navy text-paper" : "bg-ink-2 text-fg"}`}
            >
              {item}
            </button>
          ))}
        </div>
        <ul className="mt-3 space-y-2">
          {shown.map((offer) => (
            <li key={offer.id} className="rounded-2xl bg-ink-2 px-3 py-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold">{offer.name}</p>
                <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold">{offer.band}</span>
              </div>
              <p className="mt-1 text-xs text-muted">{offer.fact}</p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <a href={offer.source} target="_blank" rel="noreferrer" className="text-xs font-medium text-violet">
                  Listing
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setPlace(offer.where);
                    setPicked(offer.id);
                    logScout(offer.where);
                  }}
                  className="rounded-full bg-navy px-3 py-1.5 text-xs font-semibold text-paper"
                >
                  {picked === offer.id ? "On the day" : "We'll do this"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-4 rounded-[24px] bg-navy p-4 text-paper">
        <p className="font-semibold">Scout is here</p>
        <p className="mt-1 text-sm text-paper/75">
          Set the destination. Open it in Google Maps or Apple Maps. Scout logs it and passes it to Pulse.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {ZONES.map((zone) => (
            <button
              key={zone.id}
              type="button"
              onClick={() => setPlace(zone.name)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${place === zone.name ? "bg-gold text-navy" : "bg-white/10"}`}
            >
              {zone.name}
            </button>
          ))}
        </div>
        <input
          value={place}
          onChange={(e) => setPlace(e.target.value)}
          placeholder="Where to"
          className="mt-3 h-11 w-full rounded-full bg-white/10 px-4 text-sm outline-none placeholder:text-paper/40"
        />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <a
            href={links.google}
            target="_blank"
            rel="noreferrer"
            onClick={() => logScout(place)}
            className="rounded-full bg-paper py-2.5 text-center text-sm font-semibold text-navy"
          >
            Google Maps
          </a>
          <a
            href={links.apple}
            target="_blank"
            rel="noreferrer"
            onClick={() => logScout(place)}
            className="rounded-full bg-white/10 py-2.5 text-center text-sm font-semibold"
          >
            Apple Maps
          </a>
        </div>
        {latest ? (
          <p className="mt-3 text-xs text-paper/70">
            Logged {latest.place}. Passed to Pulse for the plan.
          </p>
        ) : null}
      </section>
    </>
  );
}
