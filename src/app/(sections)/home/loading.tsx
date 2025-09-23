import { Spin } from "antd";

export default function loading() {
  return (
    <>
      <Spin tip="Cargando..." size="large" fullscreen />
    </>
  );
}
