// UserContext.tsx
import { createContext, useContext, useState, ReactNode } from "react";

type UserSettings = {
  name: string;
  email: string;
  phone: string;
};

const UserContext = createContext<{
  user: UserSettings;
  setUser: (u: UserSettings) => void;
}>({ user: { name: "", email: "", phone: "" }, setUser: () => {} });

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserSettings>({ name: "", email: "", phone: "" });
  return <UserContext.Provider value={{ user, setUser }}>{children}</UserContext.Provider>;
};

export const useUser = () => useContext(UserContext);
