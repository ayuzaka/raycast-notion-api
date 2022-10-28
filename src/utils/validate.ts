export const validateURL = (value: string | undefined): string | null => {
  if (!value) {
    return "URL is required";
  }

  try {
    new URL(value);
  } catch (err) {
    if (err instanceof TypeError) {
      return err.message;
    }

    return "invalid URL";
  }

  return null;
};
