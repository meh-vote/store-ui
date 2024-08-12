import Toastify from 'toastify-js'
import "toastify-js/src/toastify.css"


export function showToast({ _msg = "Success!", _dur = 3000, _link = null }) {
    const out = Toastify({
        text: _msg,
        duration: _dur,
        gravity: 'bottom',
        position: 'right',
        close: (_link) ? false : true,  // if a link it provided, don't allow close before timeout
        style: {
            background: "linear-gradient(to right, #00b09b, #96c93d)",
        },
        stopOnFocus: true
    }).showToast();
    return out;
}
