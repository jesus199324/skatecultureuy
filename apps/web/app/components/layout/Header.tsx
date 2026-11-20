import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";
import { NAV_ITEMS } from "../../../../../packages/shared/src";
import { MarkerNote, cx } from "../ui/primitives";
import { A } from "../ui/A";

export function Logo({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <span className={cx("flex items-center gap-1.5 whitespace-nowrap font-display leading-[0.9] tracking-[-0.03em] text-ink sm:gap-2.5", size === "md" ? "text-[18px] sm:text-[30px] md:text-[56px]" : "text-[19px]")}>
      SKATE CULTURE
      <span className="inline-block -rotate-6 border-[3px] border-bone bg-celeste px-2 pb-0.5 pt-1 text-ink outline-2 outline-ink">UY</span>
    </span>
  );
}

function TopBar() {
  return (
    <div className="bg-ink text-bone">
      <div className="label mx-auto flex h-10 max-w-[1440px] items-center justify-between px-5 text-[13px] font-medium md:px-12">
        <span>Revista independiente<span className="hidden sm:inline"> · Hecha en Uruguay</span></span>
        <span className="hidden gap-6 md:flex">
          <A href="https://instagram.com/" className="hover:text-sun">Instagram</A>
          <A href="/about#enviar" className="hover:text-sun">Enviar material →</A>
        </span>
      </div>
    </div>
  );
}

/** Tres tablas (negro, azul, negro). Al abrir: cruz blanca sobre el azul de la bandera. */
function DecksIcon() {
  return (
    <svg width="26" height="22" viewBox="0 0 26 22" aria-hidden="true">
      <rect className="deck deck-1" x="1" y="2" width="24" height="4.5" rx="2.25" fill="currentColor" />
      <rect className="deck deck-2" x="1" y="8.75" width="24" height="4.5" rx="2.25" fill="var(--color-accent)" />
      <rect className="deck deck-3" x="1" y="15.5" width="24" height="4.5" rx="2.25" fill="currentColor" />
    </svg>
  );
}

/** Sección activa: /spots y /spots/lo-que-sea marcan SPOTS. */
export const isActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

export function Header() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  // Al navegar a otra página, el menú se cierra.
  useEffect(() => setOpen(false), [pathname]);
  const [menuTop, setMenuTop] = useState(0);
  const headerRef = useRef<HTMLElement>(null);
  const firstLink = useRef<HTMLAnchorElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  // Menú abierto: bloquea el scroll, enfoca el primer link y cierra con Escape.
  useEffect(() => {
    if (!open) return;
    setMenuTop(Math.max(0, headerRef.current?.getBoundingClientRect().bottom ?? 0));
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    firstLink.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <TopBar />
      <header ref={headerRef} className="sticky top-0 z-30 border-b-2 border-ink bg-bone lg:static">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-5 py-3 md:items-end md:gap-6 md:px-12 md:pb-5 md:pt-7">
          <A href="/" aria-label="SKATE CULTURE UY, inicio" className="flex flex-col gap-2">
            <Logo />
            <span className="label hidden text-[11px] font-semibold tracking-[0.28em] text-muted sm:block md:text-[13px]">THE CULTURE. THE PEOPLE. THE STREETS.</span>
          </A>
          <nav aria-label="Secciones" className="hidden gap-6 pb-1.5 lg:flex">
            {NAV_ITEMS.map((item) => (
              <A
                key={item.href}
                href={item.href}
                aria-current={isActive(pathname, item.href) ? "page" : undefined}
                className={cx(
                  "label border-b-[3px] pb-0.5 text-[15px] tracking-[0.14em] hover:text-accent",
                  isActive(pathname, item.href) ? "border-accent text-accent" : "border-transparent",
                )}
              >
                {item.label}
              </A>
            ))}
          </nav>
          <button
            ref={button}
            type="button"
            aria-expanded={open}
            aria-controls="menu-movil"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setOpen((v) => !v)}
            className={cx(
              "label inline-flex min-h-11 flex-none cursor-pointer items-center gap-2 border-2 border-ink px-2.5 text-sm transition-colors lg:hidden",
              open ? "bg-accent text-bone" : "bg-bone text-ink",
            )}
          >
            <DecksIcon />
            MENÚ
          </button>
        </div>
      </header>
      {open && (
        <nav id="menu-movil" aria-label="Menú" className="fixed inset-x-0 bottom-0 z-20 flex flex-col overflow-y-auto bg-ink lg:hidden" style={{ top: menuTop }}>
          <div className="h-2 sun-stripe" />
          <ul className="m-0 flex list-none flex-col gap-2 p-5">
            {NAV_ITEMS.map((item, i) => (
              <li key={item.href}>
                <A
                  ref={i === 0 ? firstLink : undefined}
                  href={item.href}
                  aria-current={isActive(pathname, item.href) ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={cx("block py-1 font-display text-[32px] leading-[1.05] hover:text-celeste", isActive(pathname, item.href) ? "text-celeste" : "text-bone")}
                >
                  {item.label}
                </A>
              </li>
            ))}
          </ul>
          <A href="/about#enviar" className="mt-auto p-5 text-lg" onClick={() => setOpen(false)}>
            <MarkerNote className="text-sun" rotate={-3}>enviá tu material →</MarkerNote>
          </A>
        </nav>
      )}
    </>
  );
}
