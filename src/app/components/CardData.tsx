import { Skeleton } from "antd";

interface CardProps {
  title: string;
  amount: string;
  percentage: string | number;
  currency: string;
  loading?: boolean;
}

const CardData: React.FC<CardProps> = ({
  title,
  amount,
  percentage,
  currency,
  loading = false,
}) => {
  const isNegative = String(percentage).startsWith("-");
  const badgeClass = isNegative
    ? "bg-gray-100 text-gray-800"
    : "bg-accent-light text-accent";

  return (
    <div className="w-full max-w-[14rem] min-h-[7rem] p-[1rem] bg-white border border-accent-light-active rounded-xl shadow-sm hover:shadow-md transition-shadow">
      {loading ? (
        <div className="flex flex-col gap-2">
          <Skeleton.Input
            active
            size="small"
            style={{ width: "60%", background: "#ebeff4" }}
          />
          <div className="flex items-center gap-2">
            <Skeleton.Input
              active
              size="default"
              style={{ width: "50%", background: "#ebeff4" }}
            />
          </div>
          <Skeleton.Input
            active
            size="small"
            style={{ width: "40%", background: "#ebeff4" }}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium ">{title}</p>
          <div className="flex items-center gap-2">
            <p className="text-xl font-bold text-gray-900">{amount}</p>
            <span className={`text-xs px-2 py-1 rounded-full ${badgeClass}`}>
              {percentage}%
            </span>
          </div>
          <p className="text-xs text-gray-500">{currency}</p>
        </div>
      )}
    </div>
  );
};

export default CardData;
