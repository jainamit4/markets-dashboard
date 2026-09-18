type Props = {
  eyebrow?: string;
  title: string;
  hint?: string;
};

export function SectionTitle({ eyebrow, title, hint }: Props) {
  return (
    <div className="section-head">
      {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
      <h2>{title}</h2>
      {hint ? <p className="section-hint">{hint}</p> : null}
    </div>
  );
}
