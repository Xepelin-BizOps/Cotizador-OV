import { Skeleton } from "antd";

export default function SkeletonTabList() {
  return (
    <div className="w-full p-4 space-y-3">
      {/* Título */}
      <Skeleton.Input
        active
        style={{ width: 200, height: 30, marginBottom: 16 }}
      />

      {/* Fila con 4 skeletons horizontales */}
      <div className="flex flex-col gap-5 md:flex-row md:items-center">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:w-full">
          <Skeleton.Input active style={{ width: 250, height: 28 }} />
          <Skeleton.Input active style={{ width: 220, height: 28 }} />
        </div>
        <Skeleton.Button active style={{ width: 180, height: 28 }} />
        <Skeleton.Button active style={{ width: 160, height: 28 }} />
      </div>

      <div className="mt-8 rounded-md overflow-hidden">
        <div className="min-h-[24rem]">
          <Skeleton active title={false} paragraph={{ rows: 12 }} />
        </div>
      </div>
    </div>
  );
}
