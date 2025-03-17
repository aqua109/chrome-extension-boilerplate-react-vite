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
    document.documentElement.classList.add('active-modal');
  } else {
    document.documentElement.classList.remove('active-modal');
  }

  return (
    <>
      {modal && (
        <div className="modal">
          <div onClick={toggleModal} className="overlay"></div>
          <div className="modal-content">
            <h2 id="ai-modal-title">Evaluating Query...</h2>
            <p id="ai-summary-text">{props.text}</p>
            <BarLoader id="summary-loader" color="purple" loading={loading} aria-label="Loading AI Response" />
            <button className="close-modal" onClick={toggleModal}>
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Modal;
