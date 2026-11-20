import { cx } from "../ui/primitives";

export interface FilterOption<T extends string> {
  id: T;
  label: string;
}

/** Botones de filtro (aria-pressed). onDark para secciones negras. */
export function FilterChips<T extends string>({
  options, value, onChange, label, onDark = false,
}: { options: FilterOption<T>[]; value: T; onChange: (v: T) => void; label: string; onDark?: boolean }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.id)}
            className={cx(
              "label min-h-11 cursor-pointer border px-4 text-[13px] transition-colors",
              onDark
                ? on ? "border-celeste bg-celeste text-ink" : "border-stone text-bone hover:border-celeste"
                : on ? "border-ink bg-ink text-bone" : "border-ink text-ink hover:bg-ink/5",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
