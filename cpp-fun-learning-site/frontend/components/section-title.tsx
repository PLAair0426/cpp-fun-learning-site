type SectionTitleProps = {
  badge: string;
  title: string;
  description: string;
};

export function SectionTitle({ badge, title, description }: SectionTitleProps) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.36em] text-slate-400">{badge}</p>
      <h2 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight text-white sm:text-[2rem]">
        {title}
      </h2>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">{description}</p>
    </div>
  );
}
