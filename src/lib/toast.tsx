import { Id, Slide, ToastContent, ToastOptions, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'default';

export const defaultToastOptions: ToastOptions = {
  position: 'top-center',
  autoClose: 1800,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: false,
  draggable: true,
  progress: undefined,
  theme: 'colored',
  transition: Slide,
};

export const showToast = (
  type: ToastType,
  content: ToastContent,
  options: Partial<ToastOptions> = {}
): Id | undefined => {
  const opts = { ...defaultToastOptions, ...options };
  switch (type) {
    case 'success':
      return toast.success(content, opts);
    case 'error':
      return toast.error(content, opts);
    case 'info':
      return toast.info(content, opts);
    case 'warning':
      return toast.warning(content, opts);
    default:
      return toast(content, opts);
  }
};
