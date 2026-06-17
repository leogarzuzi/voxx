"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type TemaInterface = "dia" | "noite";

type TemaContextValue = {
  tema: TemaInterface;
  temaDia: boolean;
  alternarTema: () => void;
  definirTema: (tema: TemaInterface) => void;
};

const TemaContext = createContext<TemaContextValue | null>(null);

export function TemaProvider({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<TemaInterface>("noite");

  useEffect(() => {
    const temaSalvo = window.localStorage.getItem("voxx-tema");

    if (temaSalvo === "dia" || temaSalvo === "noite") {
      setTema(temaSalvo);
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.tema = tema;
    document.documentElement.classList.toggle("tema-dia", tema === "dia");
    document.documentElement.classList.toggle("tema-noite", tema === "noite");
    window.localStorage.setItem("voxx-tema", tema);
  }, [tema]);

  function definirTema(proximoTema: TemaInterface) {
    setTema(proximoTema);
  }

  function alternarTema() {
    setTema((temaAtual) => (temaAtual === "dia" ? "noite" : "dia"));
  }

  const value = useMemo<TemaContextValue>(
    () => ({
      tema,
      temaDia: tema === "dia",
      alternarTema,
      definirTema,
    }),
    [tema]
  );

  return <TemaContext.Provider value={value}>{children}</TemaContext.Provider>;
}

export function useTema() {
  const context = useContext(TemaContext);

  if (!context) {
    throw new Error("useTema deve ser usado dentro de TemaProvider.");
  }

  return context;
}
