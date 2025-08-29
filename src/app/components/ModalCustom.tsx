import { Modal } from "antd";

interface Props {
  modalState: {
    open: boolean;
    title: string;
    content: React.ReactNode;
  };
  onCancel: () => void;
  width?: number;
  maskClosable?: boolean; // para que se cierre al hacer click fuera del modal
  centered?: boolean;
}

export const ModalCustom: React.FC<Props> = ({
  onCancel,
  modalState,
  maskClosable = false,
  width = 900,
}) => {
  return (
    <Modal
      title={<h2 className="text-xl font-bold">{modalState.title}</h2>}
      open={modalState.open}
      onCancel={onCancel}
      onOk={onCancel}
      centered
      maskClosable={maskClosable}
      width={width}
      footer={null}
    >
      <div className="max-h-[80vh] overflow-y-auto pr-2">
        {modalState.content}
      </div>
    </Modal>
  );
};
