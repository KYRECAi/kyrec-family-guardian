export type StoryCompanion = "pulse" | "moneybags";
export type StoryDrawing = { x: number; y: number }[][];
export type StoryEntry = {
  id: string;
  child: string;
  childName: string;
  companion: StoryCompanion;
  story: string;
  drawing: StoryDrawing;
  reply: { authorName: string; text: string } | null;
};
export type StorySession = {
  role: "adult" | "child";
  name: string;
  enabled: boolean;
  entries: StoryEntry[];
};
export interface StoryTrialAPI {
  read(): Promise<StorySession>;
  setAccess(enabled: boolean): Promise<void>;
  submit(input: { companion: StoryCompanion; story: string; drawing: StoryDrawing }): Promise<void>;
  reply(id: string, text: string): Promise<void>;
}
