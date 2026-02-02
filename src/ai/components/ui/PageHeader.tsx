import React from "react";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
};

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, icon, action }) => {
  return (
    <div className="flex flex-col lg:flex-row justify-between gap-6 items-start lg:items-center">
      <div className="min-w-0">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          {icon}
          {title}
        </h2>
        {subtitle ? (
          <p className="text-sm text-slate-500 font-medium">{subtitle}</p>
        ) : null}
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
};

export default PageHeader;
