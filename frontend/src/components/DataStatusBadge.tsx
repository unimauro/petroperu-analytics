interface Props {
  statuses: string[];
}

/** Aviso permanente de procedencia/estado de datos (anti-overclaiming). */
export default function DataStatusBadge({ statuses }: Props) {
  const illustrative = statuses.includes("illustrative");
  return (
    <div
      className={`text-xs px-2.5 py-1 rounded border ${
        illustrative
          ? "border-accent-amber/40 text-accent-amber bg-accent-amber/10"
          : "border-accent-green/40 text-accent-green bg-accent-green/10"
      }`}
      title="Estado de los datos. Las cifras 'illustrative' son de demostración; ver PROVENANCE.md."
    >
      {illustrative ? "⚠ Datos ilustrativos (demo)" : "✓ Datos verificados"}
    </div>
  );
}
