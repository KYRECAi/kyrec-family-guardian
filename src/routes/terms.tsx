import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({ component: TermsPage });

function TermsPage() {
  return (
    <div className="mx-auto max-w-lg py-4">
      <Link to="/settings" className="text-sm text-violet">
        ‹ Settings
      </Link>
      <h1 className="mt-3 text-2xl font-semibold">Terms and conditions</h1>
      <p className="mt-2 text-xs text-subtle">Family Guardian · October 2026 · family beta</p>
      <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted">
        <p>
          Family Guardian helps a household see chosen locations, plans, and companion support. It
          is not an emergency service, a medical service, insurance, or professional advice.
        </p>
        <p>
          You stay in control. Location sharing, check-ins, plans, and companion chat are choices
          you turn on. KYREC does not decide for your household.
        </p>
        <p>
          Companions are not parents, carers, therapists, financial advisers, or emergency services.
          If anyone is in danger in Australia, call 000.
        </p>
        <p>
          Plan prices are in Australian dollars. Your chosen plan is saved on this device. Card
          payment is completed in the app store when billing is switched on. This copy of the app
          does not charge a card.
        </p>
        <p>
          Your account and shared shopping activity are stored on KYREC servers. OpenAI chat and
          Google Maps have separate choices and provider data policies. Read the Privacy page for
          the current beta data flow. Clearing device preferences does not delete your server
          account.
        </p>
      </div>
    </div>
  );
}
