export type MasterActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export const initialMasterActionState: MasterActionState = {
  status: "idle",
  message: "",
};
