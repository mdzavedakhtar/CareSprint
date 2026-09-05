const PageHeader = ({ eyebrow, title, description }) => (
  <div>
    {eyebrow && (
      <p className="text-sm text-slate-500">
        {eyebrow}
      </p>
    )}

    <h1 className="mt-1 text-3xl font-bold text-slate-900">
      {title}
    </h1>

    {description && (
      <p className="mt-2 text-slate-500">
        {description}
      </p>
    )}
  </div>
);

export default PageHeader;