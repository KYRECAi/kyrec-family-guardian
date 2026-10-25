import { useRef, useState } from "react";
import { readChatMemories, suggestChatMemory } from "@/lib/companion-ai";
import type { CompanionId } from "@/lib/companions";
import type { ChatMemoryOptions } from "@/lib/companion-chat-contract";

export function CompanionChatMemory({
  id,
  name,
  household,
  disabled,
  selected,
  onChange,
}: {
  id: CompanionId;
  name: string;
  household: string;
  disabled: boolean;
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [options, setOptions] = useState<ChatMemoryOptions | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [field, setField] = useState("");
  const [value, setValue] = useState("");
  const operation = useRef<{ key: string; id: string } | null>(null);
  const [remember, setRemember] = useState(false);
  const button = "min-h-11 rounded-xl bg-ink-2 px-3 py-2 text-xs font-semibold disabled:opacity-50";
  async function refresh() {
    setBusy(true);
    setNotice("");
    setOptions(null);
    onChange([]);
    try {
      const result = await readChatMemories({ data: { id, household } });
      setOptions(result);
      setField(result.fields.length ? "0" : "");
    } catch {
      setNotice(
        "Memory is unavailable for this companion. You can still chat without remembered facts.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function propose() {
    const chosen = options?.fields[Number(field)];
    if (!chosen || !value.trim() || busy || disabled) return;
    const operationKey = JSON.stringify({ ...chosen, value: value.trim() });
    if (operation.current?.key !== operationKey)
      operation.current = { key: operationKey, id: crypto.randomUUID() };
    setBusy(true);
    setNotice("");
    try {
      const result = await suggestChatMemory({
        data: {
          id,
          household,
          operation_id: operation.current!.id,
          fact: { ...chosen, value: value.trim() },
        },
      });
      setNotice(
        result.status === "pending"
          ? "Suggestion saved for owner review. It is not available to chat until approved."
          : "This suggestion has already been reviewed. Refresh to check current memories.",
      );
      operation.current = null;
      setValue("");
      setRemember(false);
    } catch {
      setNotice("The suggestion could not be confirmed. Check memory access and try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      aria-label={name + " memory choices"}
      className="mt-3 max-h-[40vh] shrink-0 overflow-y-auto rounded-xl border border-line p-3 text-xs"
    >
      <button
        type="button"
        className={button}
        disabled={disabled || busy}
        onClick={() => void refresh()}
      >
        {options ? "Refresh memory choices" : "Choose remembered facts"}
      </button>
      {busy ? (
        <p role="status" className="mt-2">
          Checking memory.
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="mt-2">
          {notice}
        </p>
      ) : null}
      {options ? (
        <>
          <p className="mt-2 text-muted">
            Choose up to eight facts relevant to {name}'s role. Each selected fact will be sent to
            OpenAI with your next message for {name} to use. Other companions need their own
            selection.
          </p>
          <p className="mt-1 text-muted">
            Changing these choices clears this chat. With memory selected, each answer uses your new
            message and current facts; earlier messages are not sent again.
          </p>
          {options.memories.length === 0 ? (
            <p className="mt-2">No approved memories available yet.</p>
          ) : null}
          <div className="mt-2 max-h-44 space-y-2 overflow-y-auto">
            {options.memories.map((item) => (
              <label key={item.memory_id} className="flex gap-2 rounded-lg bg-ink-2 p-2">
                <input
                  type="checkbox"
                  checked={selected.includes(item.memory_id)}
                  disabled={
                    disabled || busy || (!selected.includes(item.memory_id) && selected.length >= 8)
                  }
                  onChange={(e) =>
                    onChange(
                      e.target.checked
                        ? [...selected, item.memory_id]
                        : selected.filter((id) => id !== item.memory_id),
                    )
                  }
                />
                <span className="min-w-0 break-words">
                  <span className="block text-muted">
                    Use with {name}: {item.memory_key.replaceAll("_", " ")}
                  </span>
                  {item.value}
                </span>
              </label>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              className={button}
              disabled={disabled || busy}
              onClick={() => setRemember((v) => !v)}
            >
              Remember a fact
            </button>
            <a href="/companions" className={button}>
              Review or forget memories
            </a>
          </div>
          {remember ? (
            <div className="mt-2 space-y-2">
              <p>
                Write one fact you want saved. The configured owner reviews it before it becomes
                memory. Chats are never saved automatically.
              </p>
              <label className="block">
                Fact type
                <select
                  aria-label="Fact type"
                  value={field}
                  disabled={disabled || busy}
                  onChange={(e) => setField(e.target.value)}
                  className="mt-1 h-11 w-full rounded-lg bg-ink-2 px-2"
                >
                  {options.fields.map((f, i) => (
                    <option key={f.category + ":" + f.memory_key} value={i}>
                      {f.memory_key.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                Fact to remember
                <input
                  aria-label="Fact to remember"
                  value={value}
                  maxLength={200}
                  disabled={disabled || busy}
                  onChange={(e) => setValue(e.target.value)}
                  className="mt-1 h-11 w-full rounded-lg bg-ink-2 px-2"
                />
              </label>
              <button
                type="button"
                className={button}
                disabled={disabled || busy || !value.trim()}
                onClick={() => void propose()}
              >
                Send for memory review
              </button>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
