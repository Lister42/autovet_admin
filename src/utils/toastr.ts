import 'toastr/build/toastr.min.css';
import toastr from 'toastr';

const options_success: ToastrOptions = {
    closeButton: false,
    debug: false,
    newestOnTop: false,
    progressBar: false,
    positionClass: "toast-bottom-right",
    preventDuplicates: true,
    onclick: undefined,
    showDuration: 300,
    hideDuration: 1000,
    timeOut: 5000,
    extendedTimeOut: 1000,
    showEasing: "swing",
    hideEasing: "linear",
    showMethod: "fadeIn",
    hideMethod: "fadeOut",
    toastClass: 'toast toast-success'
}

const options_warning: ToastrOptions = {
    closeButton: false,
    debug: false,
    newestOnTop: false,
    progressBar: false,
    positionClass: "toast-bottom-right",
    preventDuplicates: true,
    onclick: undefined,
    showDuration: 300,
    hideDuration: 1000,
    timeOut: 5000,
    extendedTimeOut: 1000,
    showEasing: "swing",
    hideEasing: "linear",
    showMethod: "fadeIn",
    hideMethod: "fadeOut",
    toastClass: 'toast toast-warning'
}

const options_error: ToastrOptions = {
    closeButton: false,
    debug: false,
    newestOnTop: false,
    progressBar: false,
    positionClass: "toast-bottom-right",
    preventDuplicates: true,
    onclick: undefined,
    showDuration: 300,
    hideDuration: 1000,
    timeOut: 5000,
    extendedTimeOut: 1000,
    showEasing: "swing",
    hideEasing: "linear",
    showMethod: "fadeIn",
    hideMethod: "fadeOut",
    toastClass: 'toast toast-error'
}

const options_info: ToastrOptions = {
    closeButton: false,
    debug: false,
    newestOnTop: false,
    progressBar: false,
    positionClass: "toast-bottom-right",
    preventDuplicates: true,
    onclick: undefined,
    showDuration: 300,
    hideDuration: 1000,
    timeOut: 5000,
    extendedTimeOut: 1000,
    showEasing: "swing",
    hideEasing: "linear",
    showMethod: "fadeIn",
    hideMethod: "fadeOut",
    toastClass: 'toast toast-info'
}

export const showNotification = (type: string, message: string) => {
    switch (type) {
      case 'success':
        toastr.success(message, undefined, options_success);
        break;
      case 'warning':
        toastr.warning(message, undefined, options_warning);
        break;
      case 'error':
        toastr.error(message, undefined, options_error);
        break;
      default:
        toastr.info(message, undefined, options_info);
        break;
    }
  };
  