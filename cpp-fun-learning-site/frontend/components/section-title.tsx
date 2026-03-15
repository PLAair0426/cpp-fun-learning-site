type SectionTitleProps = {
  badge: string;
  title: string;
  description: string;
};

export function SectionTitle({ badge, title, description }: SectionTitleProps) {
  return (
    <div className="section-heading">
      <div className="section-heading__top">
        <span className="section-heading__badge">{badge}</span>
        <span className="section-heading__rule" />
      </div>
      <h2 className="section-heading__title">{title}</h2>
      <p className="section-heading__description">{description}</p>
    </div>
  );
}
