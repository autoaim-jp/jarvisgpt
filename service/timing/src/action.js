export const getFileHandler = ({ handleFileRequest }) => {
  return (req, res) => {
    handleFileRequest({ res })
  }
}

