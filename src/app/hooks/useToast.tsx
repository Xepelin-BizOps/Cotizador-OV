import { notification } from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";

export type ToastType = "success" | "danger" | "error" | "info";

export interface ToastOptions {
  title?: string;
  message: string;
  type: ToastType;
  duration?: number;
  placement?: "topLeft" | "topRight" | "bottomLeft" | "bottomRight";
  onClose?: () => void;
  showProgress?: boolean;
  icon?: React.ReactNode; // Permite ícono custom si se quiere
}

const useToast = () => {
  const [api, contextHolder] = notification.useNotification();

  const showToast = ({
    title,
    message,
    type,
    duration = 3,
    placement = "topRight",
    onClose,
    showProgress = false,
    icon,
  }: ToastOptions) => {
    const iconMap: Record<ToastType, React.ReactNode> = {
      success: <CheckCircleOutlined style={{ color: "#22c55e" }} />, // green-500
      danger: <ExclamationCircleOutlined style={{ color: "#f97316" }} />, // orange-500
      error: <CloseCircleOutlined style={{ color: "#ef4444" }} />, // red-500
      info: <InfoCircleOutlined style={{ color: "#3b82f6" }} />, // blue-500
    };

    const defaultTitles: Record<ToastType, string> = {
      success: "Éxito",
      danger: "Atención",
      error: "Error",
      info: "Información",
    };

    api.open({
      message: title || defaultTitles[type],
      description: message,
      duration,
      placement,
      pauseOnHover: true,
      className: "rounded-md shadow-md",
      icon: icon || iconMap[type],
      onClose,
      showProgress,
    });
  };

  return { showToast, contextHolder };
};

export default useToast;
