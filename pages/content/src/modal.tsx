import { useState } from 'react';
import { BarLoader } from 'react-spinners';

type AISummary = {
  text: string;
};

const Modal = (props: AISummary) => {
  const [modal, setModal] = useState(true);
  const [loading, setLoading] = useState(true);

  const toggleModal = () => {
    setModal(!modal);

    if (modal) {
      var modalDiv = document.getElementById('ai-summary-modal');
      modalDiv?.remove();

      var modalStyle = document.getElementById('ai-summary-style');
      modalStyle?.remove();
    }
  };

  const toggleLoading = () => {
    setLoading(!loading);
  };

  if (modal) {
    document.documentElement.classList.add('pp-active-modal');
  } else {
    document.documentElement.classList.remove('pp-active-modal');
  }

  return (
    <>
      {modal && (
        <div className="pp-modal">
          <div onClick={toggleModal} className="pp-overlay"></div>
          <div className="pp-modal-content" id="ai-modal-content">
            <div className="pp-modal-title" id="ai-modal-title">
              Evaluating Query...
            </div>
            <BarLoader id="summary-loader" color="purple" loading={loading} aria-label="Loading AI Response" />
            <button className="pp-close-modal" onClick={toggleModal}>
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Modal;
