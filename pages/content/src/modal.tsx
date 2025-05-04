import { useEffect, useState } from 'react';
import { BarLoader } from 'react-spinners';
import { styled } from '@mui/material/styles';
import LinearProgress, { linearProgressClasses, LinearProgressProps } from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

type ModalProps = {
  loadingStyle: string;
  timeRemaining?: number;
};

const Modal = (props: ModalProps) => {
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

  const IndeterminateLoadingBar = styled(LinearProgress)(({ theme }) => ({
    height: 10,
    borderRadius: 5,
    [`&.${linearProgressClasses.colorPrimary}`]: {
      backgroundColor: theme.palette.grey[200],
      ...theme.applyStyles('dark', {
        backgroundColor: theme.palette.grey[800],
      }),
    },
    [`& .${linearProgressClasses.bar}`]: {
      borderRadius: 5,
      backgroundColor: '#4c2980',
      ...theme.applyStyles('dark', {
        backgroundColor: '#4c2980',
      }),
    },
  }));

  const DeterminateLoadingBar = styled(LinearProgress)(({ theme }) => ({
    height: 10,
    borderRadius: 5,
    [`&.${linearProgressClasses.colorPrimary}`]: {
      backgroundColor: theme.palette.grey[200],
      ...theme.applyStyles('dark', {
        backgroundColor: theme.palette.grey[800],
      }),
    },
    [`& .${linearProgressClasses.bar}`]: {
      borderRadius: 5,
      backgroundColor: '#4c2980',
      ...theme.applyStyles('dark', {
        backgroundColor: '#b306bf',
      }),
    },
  }));

  const LinearProgressWithLabel = (props: LinearProgressProps & { value: number }) => {
    return (
      <Box id="summary-loader" sx={{ display: 'flex', alignItems: 'center' }}>
        <Box sx={{ width: '100%', mr: 1 }}>
          <DeterminateLoadingBar variant="determinate" {...props} />
        </Box>
        <Box sx={{ minWidth: 35 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>{`${Math.round(props.value)}%`}</Typography>
        </Box>
      </Box>
    );
  };

  const LinearWithValueLabel = (props: { timeRemaining: number }) => {
    const [progress, setProgress] = useState(props.timeRemaining);
    useEffect(() => {
      const timer = setInterval(() => {
        setProgress(prevProgress => (prevProgress >= 100 ? 10 : prevProgress + 10));
      }, 1000);
      return () => {
        clearInterval(timer);
      };
    }, []);

    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgressWithLabel value={progress} />
      </Box>
    );
  };

  const LoadingBar = (loadingStyle: string, timeRemaining?: number) => {
    if (loadingStyle === 'Indeterminate') {
      return <IndeterminateLoadingBar id="summary-loader" variant="indeterminate" />;
    } else {
      let period: number;
      if (timeRemaining === null) {
        period = 10;
      } else {
        period = timeRemaining as number;
      }
      return <LinearWithValueLabel timeRemaining={period} />;
    }
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
            {LoadingBar(props.loadingStyle, props.timeRemaining)}
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
