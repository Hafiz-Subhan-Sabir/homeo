export type BrandHeaderProps = {
  subtitle?: string;
  subtitleClassName?: string;
};

export default function BrandHeader({ subtitle, subtitleClassName = "" }: BrandHeaderProps) {
  return (
    <header className="brand-header">
      <div className="brand-logo-wrap">
        <img
          src="/quiz-funnel-logo.webp"
          alt="The Syndicate logo"
          className="brand-logo"
          width={220}
          height={140}
        />
      </div>
      <div>
        <p className="brand-kicker">THE SYNDICATE</p>
        <h1 className="brand-title">THE SOVEREIGN ENTITY AUDIT</h1>
        {subtitle ? <p className={`brand-subtitle ${subtitleClassName}`.trim()}>{subtitle}</p> : null}
      </div>
    </header>
  );
}
