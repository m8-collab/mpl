export function SupportLeagueCard({ variant = "light" }: { variant?: "light" | "dark" }) {
  const dark = variant === "dark";
  return (
    <div className={dark ? "pitch-panel rounded-md p-6" : "surface-card p-6"}>
      <p className={`eyebrow ${dark ? "text-mint" : "text-accent"}`}>Support the league</p>
      <h3 className="mt-2 font-display text-xl">Pay with Lipa na M-Pesa</h3>
      <p className={`mt-2 text-sm ${dark ? "text-primary-foreground/75" : "text-muted-foreground"}`}>
        Contributions help cover referees, pitches, and equipment for the season.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <p className={`eyebrow mb-1.5 ${dark ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
            Paybill number
          </p>
          <p className="font-display text-lg font-black tracking-wider">111999</p>
        </div>
        <div>
          <p className={`eyebrow mb-1.5 ${dark ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
            Account number
          </p>
          <p className="font-display text-lg font-black tracking-wider">344166</p>
        </div>
      </div>

      <div className="mt-3">
        <p className={`eyebrow mb-1.5 ${dark ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
          Account name
        </p>
        <p className="font-display text-sm font-bold uppercase">Mtwapa Premier CBO</p>
      </div>
    </div>
  );
}
