"use client";

import { useState } from "react";
import { useCalendar } from "./hooks/useCalendar";
import { useRoles } from "./hooks/useRoles";
import { useJourneys } from "./hooks/useJourneys";
import { useCollaborators } from "./hooks/useCollaborators";
import { useShifts } from "./hooks/useShifts";
import ProfileModal from "./components/ProfileModal";
import TerminateModal from "./components/TerminateModal";
import NotesModal from "./components/NotesModal";
import ShiftModal from "./components/ShiftModal";
import NewShiftModal from "./components/NewShiftModal";
import CollaboratorModal from "./components/CollaboratorModal";
import RolesModal from "./components/RolesModal";
import JourneysModal from "./components/JourneysModal";
import JourneyFormModal from "./components/JourneyFormModal";
import Dashboard from "./screens/Dashboard";
import Team from "./screens/Team";
import Schedule from "./screens/Schedule";
import Swaps from "./screens/Swaps";
import Remanejos from "./screens/Remanejos";
import Conflicts from "./screens/Conflicts";
import Settings from "./screens/Settings";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import FixationModal from "./components/FixationModal";
import {
  ChangePasswordScreen,
  LoginScreen,
  NoSectorScreen,
  SectorPickerScreen,
  SetupMissingScreen,
} from "./components/EntryScreens";
import { useFixations } from "./hooks/useFixations";
import { useAdjustments } from "./hooks/useAdjustments";
import { useSwaps } from "./hooks/useSwaps";
import { useRelocations } from "./hooks/useRelocations";
import { useOccurrences } from "./hooks/useOccurrences";
import { useTreCredits } from "./hooks/useTreCredits";
import { useHolidays } from "./hooks/useHolidays";
import { useSectors } from "./hooks/useSectors";
import { useAccesses } from "./hooks/useAccesses";
import { useSession } from "./hooks/useSession";
import { useLayouts } from "./hooks/useLayouts";
import { useAuth } from "./hooks/useAuth";
import { swapInMonth } from "./lib/swaps";
import { getDebtStatus, todayIso } from "./lib/relocations";
import { countUpcomingHolidays } from "./lib/holidays";
import { profileLabel } from "./lib/permissions";
import { buildBlocks } from "./lib/sectorLayout";
import type { Collaborator, Permission } from "./lib/types";

export default function Home() {
  const [selectedMenu, setActiveMenu] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [scheduleView, setScheduleView] = useState("padrao");
  const {
    year,
    month,
    days,
    monthLabel,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    getDateIso,
  } = useCalendar();

  // LOGIN DE VERDADE (Supabase)
  const auth = useAuth();
  const access = auth.access;
  const isAdmin = access?.profile === "admin";

  // setores (no banco)
  const {
    sectorList,
    sectorOptions,
    addSector,
    renameSector,
    toggleSector,
    deleteSector,
  } = useSectors({
    enabled: Boolean(access),
    canSeed: isAdmin,
  });

  // colaboradores (no banco)
  const {
    collaboratorsList,
    setCollaboratorsList,
    sortedCollaborators: allSortedCollaborators,
    activeCollaborators: allActiveCollaborators,
    terminatedCollaborators: allTerminatedCollaborators,
    teamView,
    setTeamView,
    teamSearch,
    setTeamSearch,
    searchedCollaborators: allSearchedCollaborators,
    teamContract,
    setTeamContract,
    teamRole,
    setTeamRole,
    showCollaboratorModal,
    newCollaborator,
    setNewCollaborator,
    collaboratorError,
    editingId,
    saveCollaborator,
    openNewCollaborator,
    openEditCollaborator,
    closeCollaboratorModal,
    profile,
    openProfile,
    closeProfile,
    terminateTarget,
    terminationDate,
    setTerminationDate,
    terminationError,
    openTerminate,
    closeTerminate,
    confirmTerminate,
    reactivateCollaborator,
    deleteJourneyPeriod,
    notesTarget,
    newNote,
    setNewNote,
    openNotes,
    closeNotes,
    addNote,
  } = useCollaborators({
    sectors: sectorList,
    enabled: Boolean(access),
    authorName: access?.name ?? "",
  });

  // quantos colaboradores cada setor tem
  const countBySector = (name: string) => {
    const people = collaboratorsList.filter((person) => person.sector === name);

    return {
      active: people.filter((person) => !person.terminationDate).length,
      terminated: people.filter((person) => person.terminationDate).length,
    };
  };

  const handleToggleSector = (id: number) => {
    const sector = sectorList.find((item) => item.id === id);

    return toggleSector(id, sector ? countBySector(sector.name).active : 0);
  };

  const handleDeleteSector = (id: number) => {
    const sector = sectorList.find((item) => item.id === id);
    const counts = sector ? countBySector(sector.name) : { active: 0, terminated: 0 };

    return deleteSector(id, counts.active + counts.terminated);
  };

  // acessos (só o administrador carrega e mexe)
  const {
    accesses,
    profilePermissions,
    addAccess,
    updateAccess,
    toggleAccess,
    deleteAccess,
    saveProfilePermissions,
  } = useAccesses(isAdmin);

  // SETOR ESCOLHIDO
  const {
    loaded: sessionLoaded,
    sectorId,
    mustChoose,
    choices,
    chooseSector,
    switchSector,
    resetSession,
  } = useSession(sectorList, access);

  // layout da escala setorial do setor escolhido
  const { layouts, getLayout, saveLayout, applyPsTemplate, copyLayout } =
  useLayouts(sectorList, Boolean(access), isAdmin);

  const currentLayout = sectorId !== null ? getLayout(sectorId) : undefined;
  const layoutBlocks = buildBlocks(currentLayout);

  const currentSectorName =
    sectorList.find((item) => item.id === sectorId)?.name ?? "";

  // cada pessoa só enxerga os colaboradores do setor escolhido
  const inSector = (person: Collaborator) =>
    Boolean(currentSectorName) && person.sector === currentSectorName;

  const scopedCollaboratorsList = collaboratorsList.filter(inSector);
  const sortedCollaborators = allSortedCollaborators.filter(inSector);
  const activeCollaborators = allActiveCollaborators.filter(inSector);
  const terminatedCollaborators = allTerminatedCollaborators.filter(inSector);
  const searchedCollaborators = allSearchedCollaborators.filter(inSector);

  const effectiveCount = activeCollaborators.filter(
    (person) => person.contract === "Efetivo"
  ).length;

  const cltCount = activeCollaborators.filter(
    (person) => person.contract === "Celetista"
  ).length;

  const [filterSector, setFilterSector] = useState("Todos os setores");
  const [filterRole, setFilterRole] = useState("Todas as funções");
  const [filterJourney, setFilterJourney] = useState("Todas as escalas");
  const {
    roles,
    showRoleModal,
    newRole,
    roleError,
    editingRole,
    editingRoleName,
    setNewRole,
    setEditingRoleName,
    openRoles,
    closeRoles,
    addRole,
    startEditRole,
    cancelEditRole,
    saveEditedRole,
    deleteRole,
    rolesFor,
  } = useRoles({
    collaborators: collaboratorsList,
    setCollaborators: setCollaboratorsList,
    filterRole,
    setFilterRole,
    sectorId,
    sectorName: currentSectorName,
    enabled: Boolean(access),
    canSeed: isAdmin,
  });

  const {
    journeys,
    activeJourneys,
    showJourneysModal,
    showJourneyForm,
    editingJourneyId,
    journeyForm,
    journeyError,
    journeysListError,
    setJourneyForm,
    openJourneys,
    closeJourneys,
    closeJourneyForm,
    openNewJourney,
    openEditJourney,
    toggleJourneyDay,
    saveJourney,
    toggleJourneyActive,
    deleteJourney,
  } = useJourneys({
    collaborators: collaboratorsList,
    setCollaborators: setCollaboratorsList,
    filterJourney,
    setFilterJourney,
    sectorId,
    sectorName: currentSectorName,
    enabled: Boolean(access),
    canSeed: isAdmin,
  });

  const { swaps, addSwap, removeSwap } = useSwaps(Boolean(access));

  const { relocations, addRelocation, setRelocationPayDate, removeRelocation } =
  useRelocations(Boolean(access));

  const { occurrences, addOccurrence, removeOccurrence } = useOccurrences(Boolean(access));

  const { credits, addCredit, updateCredit, removeCredit } = useTreCredits(Boolean(access));

  const { holidays: allHolidays, addHolidays, removeHoliday } = useHolidays(Boolean(access));

  // feriados só do setor escolhido: cada setor tem os seus
  const holidays = allHolidays.filter((item) => item.sectorId === sectorId);

  const {
    getShiftFor,
    getShiftOn,
    getBaseShiftOn,
    monthlyShifts,
    selectedCell,
    selectedNotice,
    hasManualShift,
    selectCell,
    closeCell,
    changeShift,
    clearShift,
    showShiftModal,
    newShift,
    setNewShift,
    openNewShift,
    closeNewShift,
    addShift,
  } = useShifts({
    year,
    month,
    days,
    getDateIso,
    journeys,
    collaborators: scopedCollaboratorsList,
    enabled: Boolean(access),
    swaps,
    relocations,
    occurrences,
    holidays,
  });

  const {
    fixations,
    fixationForm,
    fixationError,
    setFixationForm,
    openFixation,
    openEditFixation,
    closeFixation,
    saveFixation,
    deleteFixation,
  } = useFixations(Boolean(access));

  const { adjustments, adjustPerson, swapPeople, undoAdjustment } =
  useAdjustments(Boolean(access));

  // trocas, remanejos, lançamentos e saldos só das pessoas do setor escolhido
  const scopedIds = new Set(scopedCollaboratorsList.map((person) => person.id));

  const scopedSwaps = swaps.filter(
    (swap) => scopedIds.has(swap.firstId) && scopedIds.has(swap.secondId)
  );
  const scopedRelocations = relocations.filter((item) => scopedIds.has(item.personId));
  const scopedOccurrences = occurrences.filter((item) => scopedIds.has(item.personId));
  const scopedCredits = credits.filter((item) => scopedIds.has(item.personId));

  // mês exibido (AAAA-MM) e quantas trocas ele tem
  const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
  const monthSwapsCount = scopedSwaps.filter((swap) =>
    swapInMonth(swap, monthKey)
  ).length;

  // Conflitos: dívidas em aberto (Eu devo + Me deve) e feriados chegando
  const todayDate = todayIso();

  const openDebts = scopedRelocations.filter(
    (item) => getDebtStatus(item, todayDate) !== "quitado"
  ).length;

  const upcomingHolidays = countUpcomingHolidays(holidays, todayDate);

  const conflictsCount = openDebts + upcomingHolidays;

  const conflictsDetail =
    conflictsCount === 0
      ? "Nada pendente"
      : [
          openDebts > 0 &&
            `${openDebts} ${openDebts === 1 ? "dívida em aberto" : "dívidas em aberto"}`,
          upcomingHolidays > 0 &&
            `${upcomingHolidays} ${upcomingHolidays === 1 ? "feriado chegando" : "feriados chegando"}`,
        ]
          .filter(Boolean)
          .join(" · ");

  // quem está no setor escolhido só pode cadastrar colaborador nesse setor
  const sectors = currentSectorName ? [currentSectorName] : sectorOptions;

  const filteredCollaborators = sortedCollaborators.filter((person) => {
    const matchSector =
      filterSector === "Todos os setores" || person.sector === filterSector;
    const matchRole =
      filterRole === "Todas as funções" || person.role === filterRole;
    const matchJourney =
      filterJourney === "Todas as escalas" || person.journey === filterJourney;

    const monthStart = `${year}-${String(month + 1).padStart(2, "0")}-01`;

    const stillVisible =
      !person.terminationDate || person.terminationDate >= monthStart;

    return matchSector && matchRole && matchJourney && stillVisible;
  });

  // ───────────── MENU PELAS PERMISSÕES ─────────────

  const can = (permission: Permission) =>
    access ? access.permissions.includes(permission) : false;

  const canSeeMenu = (label: string) => {
    if (!access) return false;

    switch (label) {
      case "Dashboard":
        return can("dashboard.ver");
      case "Equipe":
        return can("equipe.ver");
      case "Escalas":
        return can("escalas.ver");
      case "Trocas":
        return can("trocas.ver");
      case "Remanejos":
        return can("remanejos.ver");
      case "Conflitos":
        return can("conflitos.ver");
      case "Configurações":
        return access.profile === "admin";
      default:
        return false;
    }
  };

  const firstMenu =
    ["Dashboard", "Equipe", "Escalas", "Trocas", "Remanejos", "Conflitos", "Configurações"].find(
      canSeeMenu
    ) ?? "";

  // se a tela escolhida não é permitida para este acesso, abre a primeira que for
  const activeMenu = canSeeMenu(selectedMenu) ? selectedMenu : firstMenu;

  // ───────────── ENTRADA ─────────────

  // sair: limpa o setor escolhido e encerra a sessão de verdade
  const handleLogout = async () => {
    resetSession();
    await auth.signOut();
  };

  if (!auth.ready) return <SetupMissingScreen />;

  if (auth.loading || !sessionLoaded) return null;

  if (!access) {
    return <LoginScreen authError={auth.authError} onSignIn={auth.signIn} />;
  }

  if (access.mustChangePassword) {
    return (
      <ChangePasswordScreen
        name={access.name}
        onChange={auth.changePassword}
        onLogout={handleLogout}
      />
    );
  }

  if (sectorId === null) {
    return mustChoose ? (
      <SectorPickerScreen
        name={access.name}
        choices={choices}
        isAdmin={access.profile === "admin"}
        countActive={(name) => countBySector(name).active}
        onChoose={chooseSector}
        onOpenSettings={() => {
          chooseSector(-1);
          setActiveMenu("Configurações");
        }}
        onLogout={handleLogout}
      />
    ) : (
      <NoSectorScreen name={access.name} onLogout={handleLogout} />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">

      <Sidebar
        open={sidebarOpen}
        activeMenu={activeMenu}
        onSelect={setActiveMenu}
        canSee={canSeeMenu}
        user={{
          name: access.name,
          profile: profileLabel[access.profile],
          sector: currentSectorName || "Sem setor",
          canSwitchSector: mustChoose,
        }}
        onSwitchSector={switchSector}
        onLogout={handleLogout}
      />


      {/* ÁREA PRINCIPAL */}

      <div
        className={`transition-all duration-300 ${
          sidebarOpen ? "ml-64" : "ml-20"
        }`}
      >

        <Header
          title={activeMenu}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />


        {/* CONTEÚDO */}

        <main
          className={`p-6 ${
            activeMenu === "Equipe" ||
            activeMenu === "Escalas" ||
            activeMenu === "Trocas" ||
            activeMenu === "Remanejos" ||
            activeMenu === "Conflitos" ||
            activeMenu === "Configurações"
              ? "flex h-[calc(100vh-5rem)] flex-col overflow-hidden"
              : ""
          }`}
        >
          {activeMenu === "Equipe" && (
            <Team
              view={teamView}
              onViewChange={setTeamView}
              search={teamSearch}
              onSearchChange={setTeamSearch}
              collaborators={searchedCollaborators}
              activeCount={activeCollaborators.length}
              terminatedCount={terminatedCollaborators.length}
              effectiveCount={effectiveCount}
              cltCount={cltCount}
              roles={roles}
              contractFilter={teamContract}
              onContractFilter={setTeamContract}
              roleFilter={teamRole}
              onRoleFilter={setTeamRole}
              onOpenRoles={openRoles}
              onOpenJourneys={openJourneys}
              onNew={() =>
                openNewCollaborator(activeJourneys[0]?.name ?? "", currentSectorName)
              }
              onOpenProfile={openProfile}
              onEdit={openEditCollaborator}
              onTerminate={openTerminate}
              onReactivate={reactivateCollaborator}
              onOpenNotes={openNotes}
              canEdit={can("equipe.editar")}
            />
          )}

          <CollaboratorModal
            open={showCollaboratorModal}
            sectors={sectors}
            editing={editingId !== null}
            value={newCollaborator}
            roles={roles}
            journeys={journeys}
            error={collaboratorError}
            onChange={setNewCollaborator}
            onSave={saveCollaborator}
            onClose={closeCollaboratorModal}
          />

          {/* CARDS */}

          {activeMenu === "Dashboard" && (
            <Dashboard
              collaboratorsCount={activeCollaborators.length}
              monthlyShifts={monthlyShifts}
              monthLabel={monthLabel}
              trades={monthSwapsCount}
              conflicts={conflictsCount}
              conflictsDetail={conflictsDetail}
              onOpenConflicts={() => setActiveMenu("Conflitos")}
              people={activeCollaborators}
              getShiftOn={getShiftOn}
            />
          )}


          {/* ESCALA */}

          {activeMenu === "Escalas" && (
            <Schedule
              monthLabel={monthLabel}
              view={scheduleView}
              onViewChange={setScheduleView}
              onPrevious={goToPreviousMonth}
              onToday={goToToday}
              onNext={goToNextMonth}
              onNewShift={openNewShift}
              sectors={sectors}
              roles={roles}
              journeys={activeJourneys}
              filterSector={filterSector}
              onFilterSector={setFilterSector}
              filterRole={filterRole}
              onFilterRole={setFilterRole}
              filterJourney={filterJourney}
              onFilterJourney={setFilterJourney}
              days={days}
              collaborators={filteredCollaborators}
              allCollaborators={sortedCollaborators}
              fixations={fixations}
              onFixPerson={openFixation}
              onEditFixation={openEditFixation}
              getDateIso={getDateIso}
              getShift={getShiftFor}
              getShiftOn={getShiftOn}
              getBaseShiftOn={getBaseShiftOn}
              adjustments={adjustments}
              swaps={scopedSwaps}
              relocations={scopedRelocations}
              occurrences={scopedOccurrences}
              holidays={holidays}
              onAdjust={adjustPerson}
              onSwap={swapPeople}
              onUndoAdjust={undoAdjustment}
              onSelectCell={selectCell}
              canEdit={can("escalas.editar")}
              blocks={layoutBlocks}
            />
          )}

          {activeMenu === "Trocas" && (
            <Swaps
              monthLabel={monthLabel}
              monthKey={monthKey}
              onPrevious={goToPreviousMonth}
              onToday={goToToday}
              onNext={goToNextMonth}
              swaps={scopedSwaps}
              collaborators={sortedCollaborators}
              getShiftOn={getShiftOn}
              onAdd={addSwap}
              onRemove={removeSwap}
              canEdit={can("trocas.registrar")}
            />
          )}

          {activeMenu === "Remanejos" && (
            <Remanejos
              monthLabel={monthLabel}
              monthKey={monthKey}
              onPrevious={goToPreviousMonth}
              onToday={goToToday}
              onNext={goToNextMonth}
              relocations={scopedRelocations}
              collaborators={sortedCollaborators}
              getShiftOn={getShiftOn}
              onAdd={addRelocation}
              onSetPayDate={setRelocationPayDate}
              onRemove={removeRelocation}
              canEdit={can("remanejos.registrar")}
            />
          )}

          {activeMenu === "Configurações" && (
            <Settings
              sectors={sectorList}
              countBySector={countBySector}
              onAddSector={addSector}
              onRenameSector={renameSector}
              onToggleSector={handleToggleSector}
              onDeleteSector={handleDeleteSector}
              accesses={accesses}
              profilePermissions={profilePermissions}
              onAddAccess={addAccess}
              onUpdateAccess={updateAccess}
              onToggleAccess={toggleAccess}
              onDeleteAccess={deleteAccess}
              onSaveProfile={saveProfilePermissions}
              layouts={layouts}
              rolesFor={rolesFor}
              onSaveLayout={saveLayout}
              onApplyPsTemplate={applyPsTemplate}
              onCopyLayout={copyLayout}
            />
          )}

          {activeMenu === "Conflitos" && (
            <Conflicts
              monthLabel={monthLabel}
              monthKey={monthKey}
              onPrevious={goToPreviousMonth}
              onToday={goToToday}
              onNext={goToNextMonth}
              collaborators={sortedCollaborators}
              occurrences={scopedOccurrences}
              swaps={scopedSwaps}
              relocations={scopedRelocations}
              credits={scopedCredits}
              getShiftOn={getShiftOn}
              onAddOccurrence={addOccurrence}
              onRemoveOccurrence={removeOccurrence}
              onSetPayDate={setRelocationPayDate}
              onAddCredit={addCredit}
              onUpdateCredit={updateCredit}
              onRemoveCredit={removeCredit}
              holidays={holidays}
              roles={roles}
              onAddHolidays={(items) => {
                addHolidays(items, sectorId ?? -1);
              }}
              onRemoveHoliday={removeHoliday}
              canEdit={can("conflitos.lancar")}
            />
          )}

        </main>

      </div>

      <ShiftModal
        cell={selectedCell}
        notice={selectedNotice}
        hasManualShift={hasManualShift}
        onChange={changeShift}
        onClear={clearShift}
        onClose={closeCell}
      />

      <NewShiftModal
        open={showShiftModal}
        monthLabel={monthLabel}
        collaborators={activeCollaborators}
        days={days}
        value={newShift}
        onChange={setNewShift}
        onCancel={closeNewShift}
        onConfirm={addShift}
      />

      <RolesModal
        open={showRoleModal}
        roles={roles}
        newRole={newRole}
        onNewRoleChange={setNewRole}
        editingRole={editingRole}
        editingRoleName={editingRoleName}
        onEditingRoleNameChange={setEditingRoleName}
        error={roleError}
        onStartEdit={startEditRole}
        onCancelEdit={cancelEditRole}
        onSaveEdit={saveEditedRole}
        onDelete={deleteRole}
        onAdd={addRole}
        onClose={closeRoles}
      />

      <JourneysModal
        open={showJourneysModal}
        journeys={journeys}
        error={journeysListError}
        onNew={openNewJourney}
        onEdit={openEditJourney}
        onToggleActive={toggleJourneyActive}
        onDelete={deleteJourney}
        onClose={closeJourneys}
      />

      <JourneyFormModal
        open={showJourneyForm}
        editing={editingJourneyId !== null}
        value={journeyForm}
        error={journeyError}
        onChange={setJourneyForm}
        onToggleDay={toggleJourneyDay}
        onSave={saveJourney}
        onCancel={closeJourneyForm}
      />

      <ProfileModal
        profile={profile}
        onClose={closeProfile}
        onEdit={openEditCollaborator}
        onDeletePeriod={deleteJourneyPeriod}
        canEditTeam={can("equipe.editar")}
        canEditSchedule={can("escalas.editar")}
        layout={currentLayout}
        fixations={fixations}
        onNewFixation={(person) => openFixation(person)}
        onDeleteFixation={deleteFixation}
        onEditFixation={openEditFixation}
      />

      <FixationModal
        value={fixationForm}
        error={fixationError}
        onChange={setFixationForm}
        onSave={saveFixation}
        onClose={closeFixation}
        layout={currentLayout}
      />

      <TerminateModal
        target={terminateTarget}
        date={terminationDate}
        error={terminationError}
        onDateChange={setTerminationDate}
        onCancel={closeTerminate}
        onConfirm={confirmTerminate}
      />

      <NotesModal
        target={notesTarget}
        newNote={newNote}
        onNewNoteChange={setNewNote}
        onClose={closeNotes}
        onAdd={addNote}
      />

    </div>
  );
}