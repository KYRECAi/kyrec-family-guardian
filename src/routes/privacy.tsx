import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({ component: PrivacyPage });

function PrivacyPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <Link to="/account" className="text-sm text-violet">
        ‹ Your account
      </Link>
      <h1 className="mt-3 text-2xl font-semibold">Privacy</h1>
      <p className="mt-2 text-xs text-subtle">Family beta · updated 7 October 2026</p>
      <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted">
        <p>
          You sign in with your own confirmed email and password. KYREC stores your account,
          password hash and sessions in its account database. Confirmation and password-reset emails
          are delivered through Resend. We do not sell your profile.
        </p>
        <p>
          Your household’s membership, shared shopping list, snatches, shopping points and list
          activity are stored in KYREC Core. Current members of that household can see the shared
          list and its activity. An invitation is for one confirmed email address and expires after
          two days.
        </p>
        <p>
          Shopping suggestions use recent list additions and the interval you choose. They are
          suggestions about your list, not proof of what you bought or consumed. You decide whether
          to accept, dismiss or correct them.
        </p>
        <p>
          Companion chat is available to adult beta accounts after a separate choice to use OpenAI.
          Your message and up to six recent messages from that conversation are sent to OpenAI to
          produce a reply. KYREC does not save those chats as durable memory or share them with
          household members. OpenAI may retain data under its own API data policies; turning off
          response storage does not guarantee zero provider retention.
        </p>
        <p>
          Location sharing starts off. In this beta, an adult can choose to share their own current
          position with their household. Core holds only the latest point, without a route history.
          It stops showing a point after five minutes. Stopping sharing revokes updates and removes
          that point; expired points are removed by the running service’s retention pass each
          minute. Google Maps loads the map through the app’s shared Google configuration and
          processes requests under Google’s policies.
        </p>
        <p>
          Appearance preferences, your profile photo and other device features stay in storage
          scoped to your account on this device. Companion messages and mood notes are not saved in
          that device profile. Clear data removes device preferences; it does not delete your server
          account or shared household.
        </p>
        <p>
          Self-service deletion of the server account is still being completed. A public Google Play
          release is held until account deletion, a complete reviewed privacy notice and the store’s
          data disclosures are ready. For a privacy or deletion request, use{" "}
          <a href="https://kyrec.au" className="underline">
            KYREC’s contact page
          </a>
          .
        </p>
        <p>
          Guardian is not an emergency service. In immediate danger in Australia, call{" "}
          <a href="tel:000" className="underline">
            000
          </a>
          . A private conversation does not automatically notify your family or authorise tracking.
        </p>
      </div>
    </div>
  );
}
