import { useEffect, useRef, useState } from "react";
import { MEMBERS, SAM_ROUTE, ZONES, type MemberId } from "@/lib/family";
import { circleRing, routeLine } from "@/lib/geo";
import { entitlements } from "@/lib/plans";
import { avatarSrc } from "@/lib/avatars";
import { useGuardian } from "@/lib/store";
import { tokenColor } from "@/lib/utils";

type Positions = Partial<Record<MemberId, [number, number]>>;

function zonesForPlan() {
  const cap = entitlements(useGuardian.getState().plan).zones;
  return Number.isFinite(cap) ? ZONES.slice(0, cap as number) : ZONES;
}

function zoneCollection() {
  return {
    type: "FeatureCollection" as const,
    features: zonesForPlan().map((zone) => ({
      type: "Feature" as const,
      properties: { name: zone.name },
      geometry: { type: "Polygon" as const, coordinates: [circleRing(zone.lat, zone.lng, zone.radiusM)] },
    })),
  };
}

const RASTER = {
  version: 8 as const,
  sources: {
    osm: {
      type: "raster" as const,
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "&copy; OpenStreetMap",
    },
  },
  layers: [{ id: "osm", type: "raster" as const, source: "osm" }],
};

export function FamilyMap({
  paused,
  sharing,
  selectedId,
  onSelect,
  positions,
  variant = "full",
  compact = false,
}: {
  paused: boolean;
  sharing: Record<MemberId, boolean>;
  selectedId: MemberId | null;
  onSelect: (id: MemberId) => void;
  positions: Positions;
  variant?: "stage" | "full";
  compact?: boolean;
}) {
  const youPhoto = useGuardian((s) => s.youPhoto);
  const avatarId = useGuardian((s) => s.avatarId);
  const rootRef = useRef<HTMLDivElement>(null);
  const focusRef = useRef(selectedId);
  focusRef.current = selectedId;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const ctxRef = useRef<{
    map: import("maplibre-gl").Map;
    markers: Partial<Record<MemberId, import("maplibre-gl").Marker>>;
  } | null>(null);
  const [ready, setReady] = useState(0);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    let cancelled = false;
    let resizeObs: ResizeObserver | undefined;
    let fellBack = false;

    (async () => {
      const maplibregl = await import("maplibre-gl");
      await import("maplibre-gl/dist/maplibre-gl.css");
      if (cancelled || !el) return;

      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const map = new maplibregl.Map({
        container: el,
        style: RASTER as never,
        center: [115.91243, -32.13195],
        zoom: compact ? 15.2 : 14,
        pitch: reduce ? 0 : compact ? 32 : 52,
        bearing: reduce ? 0 : -16,
        attributionControl: compact ? false : { compact: true },
        fadeDuration: reduce ? 0 : 300,
      });

      if (variant === "full") {
        map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
      }

      const decorate = () => {
        if (cancelled) return;
        try {
          if (map.getSource("openmaptiles") && !map.getLayer("buildings-3d")) {
            map.addLayer({
              id: "buildings-3d",
              source: "openmaptiles",
              "source-layer": "building",
              type: "fill-extrusion",
              minzoom: 13,
              paint: {
                "fill-extrusion-color": "#d4dbe8",
                "fill-extrusion-height": ["coalesce", ["get", "render_height"], ["get", "height"], 10],
                "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], ["get", "min_height"], 0],
                "fill-extrusion-opacity": 0.55,
              },
            });
          }
        } catch {
          /* no buildings in this style */
        }

        if (!map.getSource("zones")) {
          map.addSource("zones", {
            type: "geojson",
            data: zoneCollection(),
          });
          map.addLayer({
            id: "zones-fill",
            type: "fill",
            source: "zones",
            paint: { "fill-color": "#1a7ef0", "fill-opacity": 0.08 },
          });
          map.addLayer({
            id: "zones-line",
            type: "line",
            source: "zones",
            paint: { "line-color": "#1a7ef0", "line-width": 1.2, "line-dasharray": [2, 2], "line-opacity": 0.55 },
          });
        }

        if (!map.getSource("sam-route")) {
          map.addSource("sam-route", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: { type: "LineString", coordinates: routeLine(SAM_ROUTE) },
            },
          });
          map.addLayer({
            id: "sam-route-glow",
            type: "line",
            source: "sam-route",
            paint: { "line-color": "#1a7ef0", "line-width": 10, "line-opacity": 0.16, "line-blur": 6 },
          });
          map.addLayer({
            id: "sam-route-line",
            type: "line",
            source: "sam-route",
            paint: { "line-color": "#1a7ef0", "line-width": 3, "line-opacity": 0.92 },
          });
        }

        if (ctxRef.current?.markers) {
          for (const marker of Object.values(ctxRef.current.markers)) marker?.remove();
        }

        const markers: Partial<Record<MemberId, import("maplibre-gl").Marker>> = {};
        for (const member of MEMBERS) {
          const node = pinNode(member, member.status === "moving");
          node.addEventListener("click", (e) => {
            e.stopPropagation();
            onSelectRef.current(member.id);
          });
          markers[member.id] = new maplibregl.Marker({ element: node, anchor: "center" })
            .setLngLat([member.lng, member.lat])
            .addTo(map);
        }

        document.querySelectorAll(".zone-chip").forEach((n) => n.parentElement?.remove());
        for (const zone of ZONES) {
          const label = document.createElement("div");
          label.className = "zone-chip";
          label.textContent = zone.name;
          new maplibregl.Marker({ element: label, anchor: "bottom" }).setLngLat([zone.lng, zone.lat]).addTo(map);
        }

        const bounds = new maplibregl.LngLatBounds();
        for (const member of MEMBERS) bounds.extend([member.lng, member.lat]);
        const desktop = window.matchMedia("(min-width: 1024px)").matches;
        map.fitBounds(bounds, {
          padding: compact
            ? { top: 24, left: 24, right: 24, bottom: 24 }
            : {
                top: 96,
                left: desktop ? 112 : 24,
                right: 24,
                bottom: variant === "stage" ? (desktop ? 168 : 220) : 240,
              },
          maxZoom: compact ? 16 : 13.4,
          duration: 0,
        });
        if (!reduce && !compact) {
          const focus = MEMBERS.find((m) => m.id === focusRef.current);
          if (focus) {
            map.jumpTo({
              center: [focus.lng, focus.lat],
              zoom: 16,
              pitch: 40,
              bearing: -16,
            });
          }
        } else if (!reduce) {
          map.easeTo({ pitch: 32, bearing: -16, duration: 800 });
        }
        map.resize();

        ctxRef.current = { map, markers };
        setReady((n) => n + 1);
      };

      map.on("load", decorate);
      map.on("error", () => {
        if (fellBack || cancelled) return;
        fellBack = true;
        map.setStyle(RASTER as never);
      });

      resizeObs = new ResizeObserver(() => map.resize());
      resizeObs.observe(el);
      requestAnimationFrame(() => map.resize());
    })();

    return () => {
      cancelled = true;
      resizeObs?.disconnect();
      ctxRef.current?.map.remove();
      ctxRef.current = null;
    };
  }, [variant, compact]);

  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    for (const member of MEMBERS) {
      const marker = ctx.markers[member.id];
      if (!marker) continue;
      const visible = !paused && sharing[member.id];
      const pos = positions[member.id] ?? [member.lat, member.lng];
      marker.setLngLat([pos[1], pos[0]]);
      const el = marker.getElement();
      el.style.display = visible ? "" : "none";
      el.classList.toggle("is-moving", member.status === "moving" && visible);
      el.classList.toggle("is-selected", selectedId === member.id);
      const img = el.querySelector("img");
      if (member.id === "michael" && img) {
        const face = youPhoto || (avatarId ? avatarSrc(avatarId) : member.avatar);
        if (face) img.src = face;
      }
    }
  }, [paused, sharing, positions, selectedId, ready, youPhoto, avatarId]);

  const didFly = useRef(false);
  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx || !selectedId || !ready) return;
    if (!didFly.current) {
      didFly.current = true;
      return;
    }
    const member = MEMBERS.find((m) => m.id === selectedId);
    if (!member) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pos = positions[member.id] ?? [member.lat, member.lng];
    ctx.map.easeTo({
      center: [pos[1], pos[0]],
      zoom: Math.max(ctx.map.getZoom(), 14),
      pitch: reduce ? 0 : 50,
      duration: reduce ? 0 : 850,
    });
  }, [selectedId, ready]);

  return <div ref={rootRef} className={compact ? "h-full min-h-0 w-full" : "h-full min-h-dvh w-full"} />;
}

function pinNode(member: (typeof MEMBERS)[number], moving: boolean) {
  const wrap = document.createElement("div");
  wrap.className = `member-pin ${moving ? "is-moving" : ""}`;
  wrap.style.setProperty("--pin-accent", tokenColor(member.accent));
  if (member.avatar) {
    wrap.innerHTML = `<img src="${member.avatar}" alt="" width="44" height="44" /><span class="pin-label"><b>${member.short}</b><span>${member.place === "Home" ? "361 Wright Road" : member.place}</span></span>`;
  } else {
    const letter = member.initial ?? member.short.slice(0, 1);
    wrap.innerHTML = `<div class="pin-initial">${letter}</div><span class="pin-label"><b>${member.short}</b><span>${member.place === "Home" ? "361 Wright Road" : member.place}</span></span>`;
  }
  return wrap;
}
