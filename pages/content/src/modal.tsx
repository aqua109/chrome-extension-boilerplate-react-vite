import { useState } from 'react';

type AISummary = {
  text: string;
};

const Modal = (props: AISummary) => {
  const [modal, setModal] = useState(true);

  const toggleModal = () => {
    setModal(!modal);

    if (modal) {
      var modalDiv = document.getElementById('ai-summary-modal');
      modalDiv?.remove();

      var modalStyle = document.getElementById('ai-summary-style');
      modalStyle?.remove();
    }
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
            <h2>Terms & Conditions AI Summary</h2>
            <p id="ai-summary-text">{props.text}</p>
            <button className="close-modal" onClick={toggleModal}>
              CLOSE
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Modal;
