import ReactDOM from "react-dom";

export default function ModalPortal({ children }) {
  const root = document.getElementById("modal-root");
  return ReactDOM.createPortal(children, root);
}
