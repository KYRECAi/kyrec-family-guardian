import { createFileRoute } from "@tanstack/react-router";
import { AccountPanel } from "@/components/family-access";

export const Route = createFileRoute("/account")({ component: AccountPanel });
