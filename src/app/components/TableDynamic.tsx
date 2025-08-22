"use client";
import { Spin, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import useKeepScrolling from "../hooks/useKeepScrolling";

export interface TableParams {
  pagination: {
    current: number; // página actual
    pageSize: number; // cuántos items por página
  };
}

interface Props<T = unknown> {
  data: T[];
  columns: ColumnsType<T>; // pasarlos asi const columns: ColumnsType<MyRowType> = [...]
  isLoading?: boolean;
  totalItems: number;
  tableParams: TableParams;
  onChangePage?: (page: number, pagiSize: number) => void;
}

// Cuando use la table pasarle el type de datos

/* <TableDynamic<MyRowType>
  data={rows}
  columns={columns}
  isLoading={loading}
/> */

export default function TableDynamic<T>({
  data,
  columns,
  isLoading = false,
  // setTableParams,
  onChangePage,
  tableParams,
  totalItems,
}: Props<T>) {
  const { elementRef } = useKeepScrolling({
    searchParams: tableParams.pagination.current.toString(),
  });

  return (
    <div className="relative min-h-[400px]" ref={elementRef}>
      {isLoading && (
        <div className="absolute border border-gray-200 rounded-lg inset-0 flex items-center justify-center bg-white/60 z-10">
          <Spin size="large">
            <p className="mt-20 text-blue-800">Cargando datos...</p>
          </Spin>
        </div>
      )}

      <Table
        rowKey={"id"}
        className="border border-gray-200 rounded-lg"
        columns={columns}
        dataSource={data}
        // pagination={{
        //   current: tableParams.pagination.current,
        //   pageSize: tableParams.pagination.pageSize,
        //   total: totalItems,
        //   showTotal: (total: number, range: [number, number]) =>
        //     `Mostrando ${range[0]}-${range[1]} de ${total} registros`,
        //   position: ["bottomCenter"],
        // }}
        // onChange={handleTableChange}
        pagination={{
          current: tableParams.pagination.current,
          pageSize: tableParams.pagination.pageSize,
          total: totalItems,
          showTotal: (total: number, range: [number, number]) =>
            `Mostrando ${range[0]}-${range[1]} de ${total} registros`,
          position: ["bottomCenter"],
        }}
        onChange={(pagination) => {
          onChangePage?.(pagination.current || 1, pagination.pageSize || 10);
        }}
        locale={{
          emptyText: isLoading ? null : "No hay registros",
        }}
        // rowSelection={
        //   {
        //     // onCell: (record, rowIndex) => ({
        //     //   // onClick: () => console.log("Seleccionar fila", record),
        //     // }),
        //     // onChange: (selectedRowKeys, selectedRows) => {
        //     //   console.log("Seleccionadas:", selectedRowKeys, selectedRows);
        //     // },
        //     // type: "checkbox",
        //   }
        // }
        // hace que la tabla se vuelva scrollable horizontalmente cuando las columnas ya no entran.
        scroll={{ x: "max-content" }}
      />
    </div>
  );
}
