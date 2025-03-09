export const formatName = (firstName: String, lastName: String) => {
  return (
    firstName.charAt(0).toUpperCase() +
    firstName.slice(1).toLowerCase() +
    ' ' +
    lastName.charAt(0).toUpperCase() +
    lastName.slice(1).toLowerCase()
  );
};
