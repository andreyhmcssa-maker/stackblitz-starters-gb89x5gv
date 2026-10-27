"use client";

import { useState } from "react";
import type { LayoutRole, SectorLayout } from "../lib/types";
import { newId } from "../lib/sectorLayout";

type Props = {
  sectorName: string;
  layout: SectorLayout;
  roles: string[]; // funções cadastradas no sistema
  onSave: (layout: SectorLayout) => void;
  onClose: () => void;
};

const fieldClass =
  "w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-blue-500";

const smallField =
  "rounded-lg border bg-white px-2 py-1.5 text-sm outline-none focus:border-blue-500";

// tira acentos e maiúsculas para comparar nomes
const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export default function LayoutEditorModal({
  sectorName,
  layout,
  roles,
  onSave,
  onClose,
}: Props) {
  const [draft, setDraft] = useState<SectorLayout>(() =>
    JSON.parse(JSON.stringify(layout))
  );
  const [newRole, setNewRole] = useState("");
  const [error, setError] = useState("");

  // ───────────── EDIÇÃO DO RASCUNHO ─────────────

  const setRole = (index: number, patch: Partial<LayoutRole>) =>
    setDraft((current) => ({
      ...current,
      roles: current.roles.map((role, i) => (i === index ? { ...role, ...patch } : role)),
    }));

  const addRole = () => {
    if (!newRole) return;

    setDraft((current) => ({
      ...current,
      roles: [
        ...current.roles,
        { role: newRole, title: newRole, posts: [], spill: "", homes: [] },
      ],
    }));

    setNewRole("");
  };

  const removeRole = (index: number) => {
    if (!window.confirm("Remover esta função do layout?")) return;

    setDraft((current) => ({
      ...current,
      roles: current.roles.filter((_, i) => i !== index),
    }));
  };

  const addPost = (roleIndex: number) => {
    const role = draft.roles[roleIndex];

    setRole(roleIndex, {
      posts: [
        ...role.posts,
        { id: newId(), label: "", slots: 1, rotation: true, day: true, night: true },
      ],
    });
  };

  const setPost = (
    roleIndex: number,
    postId: number,
    patch: Partial<LayoutRole["posts"][number]>
  ) => {
    const role = draft.roles[roleIndex];

    setRole(roleIndex, {
      posts: role.posts.map((post) => (post.id === postId ? { ...post, ...patch } : post)),
    });
  };

  // ao mudar o nome de um posto, o Apoio e os postos fixos acompanham
  const renamePost = (roleIndex: number, postId: number, label: string) => {
    const role = draft.roles[roleIndex];
    const old = role.posts.find((post) => post.id === postId)?.label ?? "";

    setRole(roleIndex, {
      posts: role.posts.map((post) => (post.id === postId ? { ...post, label } : post)),
      spill: role.spill === old ? label : role.spill,
      homes: role.homes.map((home) => (home.post === old ? { ...home, post: label } : home)),
    });
  };

  const movePost = (roleIndex: number, postIndex: number, direction: -1 | 1) => {
    const role = draft.roles[roleIndex];
    const target = postIndex + direction;

    if (target < 0 || target >= role.posts.length) return;

    const posts = [...role.posts];

    [posts[postIndex], posts[target]] = [posts[target], posts[postIndex]];

    setRole(roleIndex, { posts });
  };

  const removePost = (roleIndex: number, postId: number) => {
    const role = draft.roles[roleIndex];
    const removed = role.posts.find((post) => post.id === postId)?.label ?? "";

    setRole(roleIndex, {
      posts: role.posts.filter((post) => post.id !== postId),
      spill: role.spill === removed ? "" : role.spill,
      homes: role.homes.filter((home) => home.post !== removed),
    });
  };

  const addHome = (roleIndex: number) => {
    const role = draft.roles[roleIndex];

    setRole(roleIndex, { homes: [...role.homes, { role: "", post: "" }] });
  };

  const setHome = (
    roleIndex: number,
    homeIndex: number,
    patch: Partial<LayoutRole["homes"][number]>
  ) => {
    const role = draft.roles[roleIndex];

    setRole(roleIndex, {
      homes: role.homes.map((home, i) => (i === homeIndex ? { ...home, ...patch } : home)),
    });
  };

  const removeHome = (roleIndex: number, homeIndex: number) => {
    const role = draft.roles[roleIndex];

    setRole(roleIndex, { homes: role.homes.filter((_, i) => i !== homeIndex) });
  };

  // ───────────── SALVAR ─────────────

  const handleSave = () => {
    const fail = (message: string) => setError(message);

    // limpa espaços sobrando nos nomes
    const cleaned: SectorLayout = {
      ...draft,
      roles: draft.roles.map((role) => ({
        ...role,
        title: role.title.trim() || role.role,
        spill: role.spill.trim(),
        posts: role.posts.map((post) => ({ ...post, label: post.label.trim() })),
        homes: role.homes.map((home) => ({ ...home, post: home.post.trim() })),
      })),
    };

    if (!/^\d{4}-\d{2}-\d{2}$/.test(cleaned.rotationStart)) {
      return fail("Informe a data de início do rodízio.");
    }

    if (cleaned.roles.length === 0) return fail("Adicione pelo menos uma função.");

    for (const role of cleaned.roles) {
      if (role.posts.length === 0) {
        return fail(`${role.role}: adicione pelo menos um posto.`);
      }

      const seen = new Set<string>();

      for (const post of role.posts) {
        if (!post.label) return fail(`${role.role}: há um posto sem nome.`);

        const key = normalize(post.label);

        if (seen.has(key)) {
          return fail(
            `${role.role}: o posto "${post.label}" aparece duas vezes. Use mais vagas em um só.`
          );
        }

        seen.add(key);

        if (!Number.isInteger(post.slots) || post.slots < 1 || post.slots > 30) {
          return fail(`${role.role}: as vagas de "${post.label}" devem ser de 1 a 30.`);
        }

        if (!post.day && !post.night) {
          return fail(
            `${role.role}: "${post.label}" precisa existir no Dia, na Noite ou nos dois.`
          );
        }
      }

      if (role.spill && !role.posts.some((post) => post.label === role.spill)) {
        return fail(`${role.role}: o posto do Apoio não existe mais na lista.`);
      }

      const homeRoles = new Set<string>();

      for (const home of role.homes) {
        if (!home.role || !home.post) {
          return fail(`${role.role}: complete as funções com posto fixo.`);
        }

        if (home.role === role.role) {
          return fail(`${role.role}: a função com posto fixo não pode ser a própria função.`);
        }

        if (homeRoles.has(home.role)) {
          return fail(`${role.role}: ${home.role} aparece duas vezes nos postos fixos.`);
        }

        homeRoles.add(home.role);

        if (!role.posts.some((post) => post.label === home.post)) {
          return fail(`${role.role}: o posto fixo "${home.post}" não existe na lista.`);
        }
      }
    }

    onSave(cleaned);
    onClose();
  };

  const usedRoles = draft.roles.map((role) => role.role);
  const availableRoles = roles.filter((role) => !usedRoles.includes(role));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col rounded-2xl bg-white shadow-2xl">

        <div className="shrink-0 border-b px-6 py-4">
          <h3 className="text-xl font-bold">Layout da escala setorial</h3>
          <p className="mt-1 text-sm text-slate-500">{sectorName}</p>
        </div>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">

          <div className="max-w-xs">
            <label className="mb-1 block text-sm font-medium">
              Início do rodízio
            </label>
            <input
              type="date"
              value={draft.rotationStart}
              onChange={(event) =>
                setDraft((current) => ({ ...current, rotationStart: event.target.value }))
              }
              className={fieldClass}
            />
            <p className="mt-1 text-xs text-slate-500">
              Dia a partir do qual o rodízio é contado.
            </p>
          </div>

          <p className="rounded-lg bg-amber-50 px-4 py-3 text-xs text-amber-800">
            Mudar o nome ou remover um posto deixa sem efeito as fixações e os
            ajustes do dia já lançados nele.
          </p>

          {draft.roles.map((role, roleIndex) => (
            <div key={role.role} className="rounded-xl border">

              <div className="flex flex-wrap items-center gap-3 border-b bg-slate-50 px-4 py-3">

                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                  {role.role}
                </span>

                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-500">Nome no título</label>
                  <input
                    type="text"
                    value={role.title}
                    onChange={(event) => setRole(roleIndex, { title: event.target.value })}
                    className={`${smallField} w-56`}
                  />
                </div>

                <button
                  onClick={() => removeRole(roleIndex)}
                  className="ml-auto rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  Remover função
                </button>

              </div>

              <div className="space-y-5 p-4">

                {/* POSTOS */}
                <div>

                  <div className="mb-2 hidden grid-cols-[1fr_70px_70px_60px_60px_100px] gap-2 px-1 text-[11px] font-semibold uppercase text-slate-500 md:grid">
                    <span>Posto</span>
                    <span>Vagas</span>
                    <span>Rodízio</span>
                    <span>Dia</span>
                    <span>Noite</span>
                    <span />
                  </div>

                  <div className="space-y-2">

                    {role.posts.length === 0 && (
                      <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-500">
                        Nenhum posto ainda. Use + Adicionar posto.
                      </p>
                    )}

                    {role.posts.map((post, postIndex) => {
                      const isSpill = role.spill !== "" && post.label === role.spill;

                      return (
                        <div
                          key={post.id}
                          className="grid grid-cols-2 items-center gap-2 md:grid-cols-[1fr_70px_70px_60px_60px_100px]"
                        >

                          <input
                            type="text"
                            value={post.label}
                            onChange={(event) =>
                              renamePost(roleIndex, post.id, event.target.value)
                            }
                            placeholder="Nome do posto"
                            className={`${smallField} col-span-2 md:col-span-1`}
                          />

                          <input
                            type="number"
                            min={1}
                            max={30}
                            value={post.slots}
                            onChange={(event) =>
                              setPost(roleIndex, post.id, { slots: Number(event.target.value) })
                            }
                            className={smallField}
                          />

                          <label
                            className="flex items-center gap-1 text-xs text-slate-600"
                            title={isSpill ? "O posto do Apoio nunca entra no rodízio" : ""}
                          >
                            <input
                              type="checkbox"
                              checked={post.rotation && !isSpill}
                              disabled={isSpill}
                              onChange={(event) =>
                                setPost(roleIndex, post.id, { rotation: event.target.checked })
                              }
                            />
                            <span className="md:hidden">Rodízio</span>
                          </label>

                          <label className="flex items-center gap-1 text-xs text-slate-600">
                            <input
                              type="checkbox"
                              checked={post.day}
                              onChange={(event) =>
                                setPost(roleIndex, post.id, { day: event.target.checked })
                              }
                            />
                            <span className="md:hidden">Dia</span>
                          </label>

                          <label className="flex items-center gap-1 text-xs text-slate-600">
                            <input
                              type="checkbox"
                              checked={post.night}
                              onChange={(event) =>
                                setPost(roleIndex, post.id, { night: event.target.checked })
                              }
                            />
                            <span className="md:hidden">Noite</span>
                          </label>

                          <div className="flex gap-1">
                            <button
                              onClick={() => movePost(roleIndex, postIndex, -1)}
                              title="Subir"
                              className="rounded-lg border px-2 py-1 text-xs hover:bg-slate-50"
                            >
                              ↑
                            </button>
                            <button
                              onClick={() => movePost(roleIndex, postIndex, 1)}
                              title="Descer"
                              className="rounded-lg border px-2 py-1 text-xs hover:bg-slate-50"
                            >
                              ↓
                            </button>
                            <button
                              onClick={() => removePost(roleIndex, post.id)}
                              title="Remover posto"
                              className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                            >
                              ×
                            </button>
                          </div>

                        </div>
                      );
                    })}

                  </div>

                  <button
                    onClick={() => addPost(roleIndex)}
                    className="mt-3 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-slate-50"
                  >
                    + Adicionar posto
                  </button>

                </div>

                {/* APOIO */}
                <div className="max-w-sm">
                  <label className="mb-1 block text-sm font-medium">
                    Posto que recebe a sobra (Apoio)
                  </label>
                  <select
                    value={role.spill}
                    onChange={(event) => setRole(roleIndex, { spill: event.target.value })}
                    className={fieldClass}
                  >
                    <option value="">Nenhum</option>
                    {role.posts
                      .filter((post) => post.label.trim())
                      .map((post) => (
                        <option key={post.id} value={post.label}>
                          {post.label}
                        </option>
                      ))}
                  </select>
                  <p className="mt-1 text-xs text-slate-500">
                    Só recebe quem sobra depois que os postos do rodízio são preenchidos.
                  </p>
                </div>

                {/* FUNÇÕES COM POSTO FIXO */}
                <div>

                  <label className="mb-1 block text-sm font-medium">
                    Outras funções com posto fixo nesta planilha
                  </label>

                  <div className="space-y-2">
                    {role.homes.map((home, homeIndex) => (
                      <div key={homeIndex} className="flex flex-wrap items-center gap-2">

                        <select
                          value={home.role}
                          onChange={(event) =>
                            setHome(roleIndex, homeIndex, { role: event.target.value })
                          }
                          className={`${smallField} w-56`}
                        >
                          <option value="">Função...</option>
                          {roles
                            .filter((item) => item !== role.role)
                            .map((item) => (
                              <option key={item} value={item}>
                                {item}
                              </option>
                            ))}
                        </select>

                        <span className="text-xs text-slate-500">fica sempre em</span>

                        <select
                          value={home.post}
                          onChange={(event) =>
                            setHome(roleIndex, homeIndex, { post: event.target.value })
                          }
                          className={`${smallField} w-56`}
                        >
                          <option value="">Posto...</option>
                          {role.posts
                            .filter((post) => post.label.trim())
                            .map((post) => (
                              <option key={post.id} value={post.label}>
                                {post.label}
                              </option>
                            ))}
                        </select>

                        <button
                          onClick={() => removeHome(roleIndex, homeIndex)}
                          className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                        >
                          ×
                        </button>

                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => addHome(roleIndex)}
                    className="mt-2 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
                  >
                    + Adicionar função com posto fixo
                  </button>

                </div>

              </div>

            </div>
          ))}

          {/* NOVA FUNÇÃO */}
          <div className="flex flex-wrap items-center gap-2">

            <select
              value={newRole}
              onChange={(event) => setNewRole(event.target.value)}
              className={`${smallField} w-64`}
            >
              <option value="">Função...</option>
              {availableRoles.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <button
              onClick={addRole}
              disabled={!newRole}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              + Adicionar função
            </button>

          </div>

        </div>

        <div className="shrink-0 border-t px-6 py-4">

          {error && <p className="mb-3 text-sm font-medium text-red-600">{error}</p>}

          <div className="flex gap-3">

            <button
              onClick={onClose}
              className="flex-1 rounded-xl border px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>

            <button
              onClick={handleSave}
              className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Salvar layout
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}