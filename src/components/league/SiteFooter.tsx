import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Facebook, Instagram, Twitter, MessageCircle } from "lucide-react";
import { leagueQuery } from "@/lib/league";

export function SiteFooter() {
  const { data } = useQuery(leagueQuery);
  const social = data?.socialLinks;
  const hasSocial = social && (social.facebook || social.instagram || social.twitter || social.whatsapp);

  return (
    <footer className="pitch-panel mt-20">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 lg:grid-cols-3 lg:px-8">
        <div>
          <div className="font-display text-lg font-extrabold uppercase">Mtwapa Premier League</div>
          <p className="mt-2 max-w-sm text-sm text-primary-foreground/70">
            {data?.seasonLabel ?? "Season 2026"} · {data?.clubs.length ?? 31} clubs, one table. Run by Mtwapa Premier
            CBO on the Kenyan coast.
          </p>

          {hasSocial && (
            <div className="mt-4 flex items-center gap-3">
              {social?.facebook && (
                <a
                  href={social.facebook}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label="Mtwapa Premier League on Facebook"
                  className="text-primary-foreground/70 hover:text-mint"
                >
                  <Facebook size={18} />
                </a>
              )}
              {social?.instagram && (
                <a
                  href={social.instagram}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label="Mtwapa Premier League on Instagram"
                  className="text-primary-foreground/70 hover:text-mint"
                >
                  <Instagram size={18} />
                </a>
              )}
              {social?.twitter && (
                <a
                  href={social.twitter}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label="Mtwapa Premier League on Twitter / X"
                  className="text-primary-foreground/70 hover:text-mint"
                >
                  <Twitter size={18} />
                </a>
              )}
              {social?.whatsapp && (
                <a
                  href={social.whatsapp}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label="Mtwapa Premier League on WhatsApp"
                  className="text-primary-foreground/70 hover:text-mint"
                >
                  <MessageCircle size={18} />
                </a>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <Link to="/table" className="text-primary-foreground/70 hover:text-mint">
            League Table
          </Link>
          <Link to="/fixtures" className="text-primary-foreground/70 hover:text-mint">
            Fixtures
          </Link>
          <Link to="/clubs" className="text-primary-foreground/70 hover:text-mint">
            Clubs
          </Link>
          <Link to="/scorers" className="text-primary-foreground/70 hover:text-mint">
            Top Scorers
          </Link>
          <Link to="/discipline" className="text-primary-foreground/70 hover:text-mint">
            Discipline
          </Link>
          <Link to="/gallery" className="text-primary-foreground/70 hover:text-mint">
            Gallery
          </Link>
          <Link to="/about" className="text-primary-foreground/70 hover:text-mint">
            About
          </Link>
        </div>

        <div className="text-right">
          <p className="eyebrow text-primary-foreground/50">
            Table, fixtures &amp; scorers {data?.asOfLabel ?? ""}
          </p>
          <Link to="/admin" className="mt-2 inline-block text-xs text-primary-foreground/40 hover:text-mint">
            Admin
          </Link>
        </div>
      </div>

      {!!data?.sponsors.length && (
        <div className="border-t border-primary-foreground/10">
          <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
            <p className="eyebrow mb-3 text-primary-foreground/50">League Sponsors</p>
            <div className="flex flex-wrap items-center gap-6">
              {data.sponsors.map((s) => {
                const inner = s.logo_url ? (
                  <img src={s.logo_url} alt={s.name} className="h-8 w-auto object-contain opacity-90" />
                ) : (
                  <span className="text-sm font-semibold text-primary-foreground/70">{s.name}</span>
                );
                return s.link ? (
                  <a key={s.id} href={s.link} target="_blank" rel="noreferrer noopener sponsored" title={s.name}>
                    {inner}
                  </a>
                ) : (
                  <span key={s.id} title={s.name}>
                    {inner}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-primary-foreground/10">
        <div className="mx-auto max-w-7xl px-4 py-4 text-xs text-primary-foreground/50 lg:px-8">
          © {new Date().getFullYear()} Mtwapa Premier League — {data?.editionLabel ?? "5th Edition"}. All rights
          reserved.
        </div>
      </div>
    </footer>
  );
}
