export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
};

export const calculateDuration = (startTime: string, endTime: string): number => {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
};

export const setTimedMessage = (
  setMessage: React.Dispatch<React.SetStateAction<{ text: string; type: 'success' | 'error' } | null>>,
  text: string,
  type: 'success' | 'error'
) => {
  setMessage({ text, type });
  setTimeout(() => setMessage(null), 5000);
};
