const DashboardStatsCard = ({
  cardTitle,
  currencyIcon,
  Value,
}: {
  cardTitle: string;
  currencyIcon: string;
  Value: number;
}) => {
  return (
    <div className="rounded-xl bg-surface-container-low p-6">
      <p className="mb-4 font-['Inter'] text-xs font-medium tracking-widest text-on-surface-variant uppercase">
        {cardTitle}
      </p>
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tighter text-on-surface">
            {currencyIcon} {Value}
          </h2>
        </div>
      </div>
    </div>
  );
};

export default DashboardStatsCard;
