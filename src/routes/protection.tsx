import { createFileRoute, Link } from "@tanstack/react-router";
import { Car, House, KeyRound, Luggage } from "lucide-react";
import { UpgradeGate } from "@/components/upgrade-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/protection")({ component: Protection });

const OPTIONS = [
  { title: "Travel insurance", body: "Compare useful family cover when trusted partners become available.", icon: Luggage },
  { title: "Roadside assistance", body: "Future partner offers for breakdown support close to home or on a trip.", icon: Car },
  { title: "Rental protection", body: "Clear options for rental vehicle excess and trip-related protection.", icon: KeyRound },
  { title: "Family trip cover", body: "Explore protection designed around the people and plans travelling together.", icon: House },
];

function Protection() {
  return (
    <UpgradeGate need="scout" companion="scout">
    <div className="mx-auto max-w-lg py-4">
      <p className="text-center text-[11px] font-semibold tracking-[0.16em] text-violet uppercase">
        Scout · KYREC Family Guardian
      </p>
      <h1 className="mt-1 text-center text-xl font-semibold">Travel Protection</h1>

      <section className="mt-4 rounded-3xl bg-[linear-gradient(160deg,var(--color-blue),#4b1fa8)] p-5 text-paper">
        <p className="text-[11px] font-medium tracking-[0.16em] uppercase opacity-80">Travel with more confidence</p>
        <h2 className="mt-2 text-2xl font-semibold leading-tight">Useful partner offers, without compromising family privacy.</h2>
        <p className="mt-3 text-sm leading-relaxed opacity-90">
          Scout will bring future insurance and roadside offers into one clear place. No fake discounts, no hidden targeting and no automatic sign-up.
        </p>
        <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-paper/15 px-3 py-1.5 text-xs">
          <span className="size-1.5 rounded-full bg-green" /> Partner offers coming soon
        </p>
      </section>

      <div className="mt-5 flex items-end justify-between">
        <h2 className="font-semibold">Future protection options</h2>
        <p className="text-xs text-subtle">Nothing is for sale yet</p>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {OPTIONS.map((o) => {
          const Icon = o.icon;
          return (
            <article key={o.title} className="rounded-3xl bg-panel p-4 shadow-[var(--shadow-border)]">
              <span className="grid size-10 place-items-center rounded-xl bg-violet/12 text-violet">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-3 font-semibold">{o.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted">{o.body}</p>
              <Badge tone="blue" className="mt-3">
                Not available yet
              </Badge>
            </article>
          );
        })}
      </div>

      <section className="mt-4 rounded-3xl bg-panel p-5 shadow-[var(--shadow-border)]">
        <h2 className="font-semibold">Sponsored will always mean sponsored.</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Every paid placement will be clearly labelled. Offers will be optional, KYREC may earn a referral fee if you choose one, and we will never sell your family’s live location, private conversations or safety history to target advertising.
        </p>
      </section>

      <section className="mt-3 rounded-3xl bg-navy p-5 text-paper">
        <p className="text-3xl font-semibold">10K</p>
        <p className="mt-1 font-semibold">Family community milestone</p>
        <p className="mt-2 text-sm leading-relaxed opacity-80">
          As KYREC grows towards 10,000 families, we can approach insurers and roadside providers for genuinely useful family offers.
        </p>
      </section>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link to="/drive">
          <Button variant="outline" className="w-full">
            Back to Scout
          </Button>
        </Link>
        <Link to="/drive">
          <Button className="w-full">Plan a trip with Scout</Button>
        </Link>
      </div>
      <p className="mt-4 text-center text-xs leading-relaxed text-subtle">
        KYREC is not an insurer or financial adviser. Cover details and eligibility would come from each licensed provider.
      </p>
    </div>
    </UpgradeGate>
  );
}
