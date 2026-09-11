interface ErrorMessagesProps {
  errors: string[];
}

export function ErrorMessages({ errors }: ErrorMessagesProps) {
  if (errors.length === 0) {
    return null;
  }

  return (
    <ul className="error-messages">
      {errors.map((error) => (
        <li key={error}>{error}</li>
      ))}
    </ul>
  );
}
