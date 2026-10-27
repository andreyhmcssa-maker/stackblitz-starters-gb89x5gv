import { usePersistentState } from "./usePersistentState";
import type { Access, Sector } from "../lib/types";

export type Session = {
  sectorId: number | null; // setor escolhido (-1 = nenhum, só Configurações)
};

const EMPTY: Session = { sectorId: null };

// access = quem entrou pelo login de verdade (Supabase)
export function useSession(sectors: Sector[], access: Access | null) {
  const [session, setSession, loaded] = usePersistentState<Session>(
    "escala-sessao",
    EMPTY
  );

  // administrador e Diretoria escolhem o setor ao entrar
  const mustChoose = access?.profile === "admin" || access?.profile === "diretoria";

  // setores que a pessoa pode escolher
  const choices: Sector[] = !access
    ? []
    : access.profile === "admin"
      ? sectors.filter((item) => item.active)
      : sectors.filter((item) => item.active && access.sectorIds.includes(item.id));

  // setor em uso agora (null = ainda não escolheu ou não tem setor válido)
  let sectorId: number | null = null;

  if (access) {
    if (mustChoose) {
      const picked = session.sectorId;

      if (
        picked !== null &&
        (choices.some((item) => item.id === picked) ||
          (picked === -1 && access.profile === "admin"))
      ) {
        sectorId = picked;
      }
    } else {
      const own = sectors.find((item) => item.id === access.sectorIds[0]);

      sectorId = own ? own.id : null;
    }
  }

  const chooseSector = (id: number) => setSession({ sectorId: id });

  const switchSector = () => setSession(EMPTY);

  const resetSession = () => setSession(EMPTY);

  return {
    loaded,
    sectorId,
    mustChoose,
    choices,
    chooseSector,
    switchSector,
    resetSession,
  };
}