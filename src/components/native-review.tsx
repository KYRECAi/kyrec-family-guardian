import * as api from "@/lib/native-review";
import { NativeReviewPanel } from "./native-review-panel";

export function NativeReview({ household }: { household: string }) {
  return <NativeReviewPanel household={household} api={api} />;
}
